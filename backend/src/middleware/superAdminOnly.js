module.exports = (req, res, next) => {
  if (req?.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ super admin mới có quyền thực hiện hành động này'
    });
  }

  return next();
};


