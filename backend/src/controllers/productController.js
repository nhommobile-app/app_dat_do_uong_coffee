const Product = require('../models/Product');
const { BASE_URL } = require('../config/env');

function buildImageUrl(reqOrImage, maybeImage) {
  let image;
  let baseUrl;

  if (maybeImage === undefined) {
    image = reqOrImage;
    baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  } else {
    const req = reqOrImage;
    image = maybeImage;

    if (req && typeof req.get === 'function') {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    } else {
      baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }
  }

  if (!image) {
    return `${baseUrl}/uploads/default.jpg`;
  }

  if (typeof image === 'string' && image.startsWith('http')) {
    return image;
  }

  const cleanImage = String(image)
    .replace(/^uploads[\\/]/, '')
    .replace(/^\/+/, '');

  return `${baseUrl}/uploads/${cleanImage}`;
}

const productController = {
  async getAllProducts(req, res) {
    try {
      const products = await Product.getAll();
      products.forEach(p => {
        p.image = buildImageUrl(req, p.image);
        if (p.full_description && !p.fullDescription) {
          p.fullDescription = p.full_description;
        }
      });
      res.json(products);
    } catch (error) {
      console.error('Lỗi lấy tất cả sản phẩm:', {
        error,
        url: req.originalUrl,
        method: req.method,
        params: req.params,
        body: req.body,
        user: req.user || null
      });
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }

      const sizes = await Product.getSizes(id);
      product.sizes = sizes;
      product.image = buildImageUrl(req, product.image);
      if (product.full_description && !product.fullDescription) {
        product.fullDescription = product.full_description;
      }

      res.json(product);
    } catch (error) {
      console.error('Lỗi lấy sản phẩm theo id:', {
        error,
        url: req.originalUrl,
        method: req.method,
        params: req.params,
        body: req.body,
        user: req.user || null
      });
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async getProductsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const products = await Product.getByCategory(categoryId);
      products.forEach(p => {
        p.image = buildImageUrl(p.image);
        if (p.full_description && !p.fullDescription) {
          p.fullDescription = p.full_description;
        }
      });
      res.json(products);
    } catch (error) {
      console.error('Lỗi lấy sản phẩm theo danh mục:', {
        error,
        url: req.originalUrl,
        method: req.method,
        params: req.params,
        body: req.body,
        user: req.user || null
      });
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async getCategories(req, res) {
    try {
      const categories = await Product.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Lỗi lấy danh mục sản phẩm:', {
        error,
        url: req.originalUrl,
        method: req.method,
        params: req.params,
        body: req.body,
        user: req.user || null
      });
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  }
};

module.exports = productController; 