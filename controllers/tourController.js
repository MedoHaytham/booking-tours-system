const multer = require('multer');
// const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Tour = require('../models/tours');
const AppError = require('../utils/appError');
const asyncWrapper = require('../utils/asyncWrapper');
const httpStatus = require('../utils/httpStatusText');
const factory = require('./handlerFactory');


const multerStorge = multer.memoryStorage();

const multerFilter = ( req, file, cb ) => {
  if (file.mimetype.startsWith('image')) {
    cb ( null, true );
  } else {
    cb ( new AppError( 'Not an image! Please upload only images', 400 ), false );
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multerStorge,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

const uploadToCloudinary = file =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'tours',
        transformation: {
          width: 2000,
          height: 1333,
          crop: 'fill',
          fetch_format: 'auto',
          quality: 'auto'
        }
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });


// exports.resizeTourImages = asyncWrapper( 
//   async(req, res, next) => {
//     if ( !req.files.imageCover || !req.files.images ) return next();

//     req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

//     // 1) image cover
//     await sharp( req.files.imageCover[0].buffer )
//       .resize(2000, 1333)
//       .toFormat('jpeg')
//       .jpeg({ quality: 90 })
//       .toFile(`public/img/tours/${req.body.imageCover}`);

//     // 2) images
//     req.body.images = [];
//     await Promise.all(
//       req.files.images.map ( async (image, i) => {
//         const imageFilename = `tour-${req.params.id}-${Date.now()}-${ i + 1 }.jpeg`;
//         await sharp( image.buffer )
//           .resize(2000, 1333)
//           .toFormat('jpeg')
//           .jpeg({ quality: 90 })
//           .toFile(`public/img/tours/${imageFilename}`);
//         req.body.images.push(imageFilename);
//       })
//     );

//     next();
//   }
// );

exports.resizeTourImages = asyncWrapper( 
  async(req, res, next) => {
    if (!req.files || (!req.files.imageCover && !req.files.images)) return next();

    // 1) image cover
    if (req.files.imageCover) {
      const imageCover = await uploadToCloudinary(req.files.imageCover[0]);
      req.body.imageCover = imageCover.secure_url.replace('/upload/', '/upload/q_auto/f_auto/');
    }
  
    // 2) images
    if (req.files.images) {
      req.body.images = [];
      await Promise.all(
        req.files.images.map ( async (image) => {
          const imageFilename = await uploadToCloudinary(image)
          req.body.images.push(imageFilename.secure_url.replace('/upload/', '/upload/q_auto/f_auto/'));
        })
      );
    }
    next();
  }
);

// middleware to make top 5 cheap tours query
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,duration,difficulty';
  next();
};

// handlers
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews', select: '-__v' });

exports.createTour = asyncWrapper( 
  async (req, res, next) => {
    const newTour = await Tour.create({
      name: req.body.name,
      duration: req.body.duration,
      maxGroupSize: req.body.maxGroupSize,
      difficulty: req.body.difficulty,
      price: req.body.price,
      summary: req.body.summary,
      description: req.body.description,
      imageCover: req.body.imageCover,
      images: req.body.images,
      guides: req.body.guides,
    });

    res.status(201).json({
      status: httpStatus.SUCCESS,
      data: {
        tour: newTour,
      }
    });
  }
);

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourBySlug = asyncWrapper(
  async (req, res, next) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).populate('reviews');

    if (!tour) {
      return next(new AppError('Tour not found', 404));
    }

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        tour,
      }
    });
  }
);

exports.getToursWithin = asyncWrapper(
  async (req, res, next) => {
    const { distance, latlng, unit } = req.params;

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

    const [ lat, lng ] = latlng.split(',');

    if ( !lat || !lng ) {
      return next( new AppError('please provide latitude and longtude in the format lat,lng.', 400));
    };

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
      stauts: httpStatus.SUCCESS,
      results: tours.length,
      data: {
        tours,
      }
    });
  }
);


// aggregation pipeline handlers
exports.getTourStats = asyncWrapper( 
  async (req, res, next) => {
    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage: {$gte : 4.5}}
      },
      {
        $group: {
          _id: {$toUpper: '$difficulty'},
          numTours: { $sum: 1},
          numRatings: {$sum: '$ratingsQuantity'},
          avgRating: {$avg: '$ratingsAverage'},
          avgPrice: {$avg: '$price'},
          minPrice: {$min: '$price'},
          maxPrice: {$max: '$price'},
        }
      },
      {
        $sort: { avgRating: -1 }
      }
    ]);

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        stats
      }
    });
  }
);

exports.getMonthlyPlan = asyncWrapper( 
  async (req, res, next) => {
    const year = Number(req.params.year);
    const plan = await Tour.aggregate([
      {
        $unwind : '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-1`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {$month: '$startDates'},
          numTourStarts: {$sum: 1},
          tours: {$push: '$name'}
        }
      },
      {
        $addFields: {month: '$_id'}
      },
      {
        $project: {_id : 0}
      },
      {
        $sort: { numTourStarts: -1 }
      }
    ]);
    
    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        plan
      }
    });
  }
);

exports.getDistances = asyncWrapper(
  async ( req, res, next ) => {
    const { latlng, unit } = req.params;

    const [ lat, lng ] = latlng.split(',');
    const multiplier = unit === 'km' ? 0.001 : 0.000621371192;

    if ( !lat || !lng ) {
      return next( new AppError('please provide latitude and longtude in the format lat,lng.', 400));
    };

    const distances = await Tour.aggregate([
      {
        $geoNear: { 
          near: {
            type: 'Point',
            coordinates: [lng * 1 , lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        }, 
      },
      {
        $project: { name: 1, distance: 1 },
      },
      {
        $sort: { distance: 1 }
      },
    ]);

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        distances
      }
    })
  }
);

