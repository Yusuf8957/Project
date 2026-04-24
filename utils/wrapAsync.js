module.exports = (fn) => {
  return (req, res, next) => {
    try {
      const result = fn(req, res, next);

      // ✅ SAFE CHECK (important)
      if (result && result.catch) {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
};