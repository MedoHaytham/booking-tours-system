/* eslint-disable node/no-unsupported-features/es-syntax */
class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Remove empty-string values so they don't produce a bad MongoDB filter
    Object.keys(queryObj).forEach(key => {
      if (queryObj[key] === '' || queryObj[key] === undefined) delete queryObj[key];
    });

    // Advanced Filtering
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    
    return this;
  }

  sort() {
    if(this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    
    return this;
  }

  limitFields() {
    if(this.queryString.fields){
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  async search(fields = []) {
    if (this.queryString.search && fields.length > 0) {
      const regex = new RegExp(this.queryString.search, 'i');

      const promises = fields.map(async (field) => {
        if (field.includes('.')) {
          const [refPath, refField] = field.split('.');
          const Model = this.query.model;
          const schemaPath = Model.schema.path(refPath);

          if (schemaPath && schemaPath.options && schemaPath.options.ref) {
            const refModelName = schemaPath.options.ref;
            const RefModel = Model.db.model(refModelName);

            const matchingDocs = await RefModel.find({
              [refField]: regex
            }).select('_id');

            const ids = matchingDocs.map(d => d._id);
            return { [refPath]: { $in: ids } };
          }
          return null;
        }

        return { [field]: regex };
      });

      const conditions = await Promise.all(promises);
      const orConditions = conditions.filter(Boolean);

      if (orConditions.length > 0) {
        this.query = this.query.find({ $or: orConditions });
      }
    }
    return this;
  }
}

module.exports = APIfeatures;