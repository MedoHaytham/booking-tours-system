const multer = require('multer');
// const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const User = require('../models/users');
const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/appError');
const httpStatus = require('../utils/httpStatusText');
const factory = require('./handlerFactory');



// const multerStorge = multer.diskStorage({
//   destination: ( req, file, cb ) => {
//     cb ( null, 'public/img/users' );
//   },

//   filename: ( req, file, cb ) => {
//     const ext = file.mimetype.split('/')[1]; 
//     cb ( null, `user-${req.currentUser._id}-${Date.now()}.${ext}` );
//   }
// });

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

const uploadToCloudinary = file =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'users',

      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });

exports.uploadUserPhoto = upload.single('photo');

// exports.resizeUserPhoto = asyncWrapper(
//   async (req, res, next) => {
//     if ( !req.file ) return next();

//     req.file.filename = `user-${req.currentUser._id}-${Date.now()}.jpeg`

//     await sharp( req.file.buffer )
//       .resize(500, 500)
//       .toFormat('jpeg')
//       .jpeg({quality: 90})
//       .toFile(`public/img/users/${req.file.filename}`);

//     next();
//   }
// );

exports.resizeUserPhoto = asyncWrapper(async (req, res, next) => {
  if (!req.file) return next();

  const result = await uploadToCloudinary(req.file);

  req.body.photo = result.secure_url;

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el];
  })
  return newObj;
};

// admin only handlers
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// self update handlers
exports.updateMe = asyncWrapper(
  async (req, res, next) => {

    // 1) create error if user tries to update password
    if( req.body.password || req.body.passwordConfirm ){
      return next(new AppError('You cannot update your password here! Use /updateMyPassword instead.', 400));
    }

    // you can use this 
    // const { name, email } = req.body;
    // but filterObj is better
    
    //2) filter out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email', 'photo');
    // if( req.file ) filteredBody.photo = req.file.filename;

    // 3) update user document
    const { _id } = req.currentUser;

    const updatedUser = await User.findByIdAndUpdate( _id, filteredBody, {
      new: true, 
      runValidators: true
    });

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        user: updatedUser,
      }
    });
  }
);

exports.deleteMe = asyncWrapper(
  async (req, res, next) => {
    await User.findByIdAndUpdate(req.currentUser.id, {active: false});
    
    res.status(204).json({
      status: httpStatus.SUCCESS,
      data: null
    });
  }
);

// middleware to get current user
exports.getMe = (req, res, next) => {
  req.params.id = req.currentUser._id;
  next();
}