const asyncWrapper = require('../utils/asyncWrapper');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appError');
const APIfeatures = require('../utils/apiFeatures');

exports.getAll = (Model, searchFields = []) => asyncWrapper(
  async (req, res, next) => {

    // to allow nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.params.userId) filter = { user: req.params.userId };

    const features = new APIfeatures(Model.find(filter), req.query)
      .search(searchFields)
      .filter()
      .sort()
      .limitFields();

    // To get total number of documents
    const total = await Model.countDocuments(features.query.getFilter());

    features.paginate();
    const doc = await features.query;

    res.status(200).json({
      status: httpStatus.SUCCESS,
      total,
      results: doc.length,
      data: {
        data: doc
      }
    });
  }
);

exports.getOne = (Model, populateOptions) => asyncWrapper(
  async (req, res, next) => {

    let query = Model.findById(req.params.id);
    if ( populateOptions ) {
      query = query.populate(populateOptions);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        data: doc,
      }
    });
  }
);


exports.createOne = Model => asyncWrapper( 
  async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: httpStatus.SUCCESS,
      data: {
        data: doc,
      }
    });
  }
);

exports.updateOne = Model => asyncWrapper( 
  async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findByIdAndUpdate(id,  req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        data: doc,
      }
    });
  }
);

exports.deleteOne = Model => asyncWrapper( 
  async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    
    res.status(204).json({
      status: httpStatus.SUCCESS,
      data: null
    })
  }
);