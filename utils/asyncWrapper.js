/* eslint-disable arrow-body-style */
const asyncWrapper = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = asyncWrapper;