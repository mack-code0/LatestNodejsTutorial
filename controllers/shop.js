const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs')
const PDFdocument = require('pdfkit')

const Items_Per_Page = 1

exports.getProducts = (req, res, next) => {
  const page = typeof req.query.page === "undefined" ? 1 : +req.query.page
  
  let totalNumOfProd;

  Product.countDocuments()
  .then(numOfProducts=>{
    totalNumOfProd = numOfProducts
    return Product.find()
    .skip((page-1) * Items_Per_Page)
    .limit(Items_Per_Page)
  })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        totalProducts: totalNumOfProd,
        currentPage: page,
        hasNextPage: page * Items_Per_Page < totalNumOfProd,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalNumOfProd / Items_Per_Page)
      });
    })
    .catch(err => {
      next(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = typeof req.query.page === "undefined" ? 1 : +req.query.page
  
  let totalNumOfProd;

  Product.countDocuments()
  .then(numOfProducts=>{
    totalNumOfProd = numOfProducts
    return Product.find()
    .skip((page-1) * Items_Per_Page)
    .limit(Items_Per_Page)
  })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        totalProducts: totalNumOfProd,
        currentPage: page,
        hasNextPage: page * Items_Per_Page < totalNumOfProd,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalNumOfProd / Items_Per_Page)
      });
    })
    .catch(err => {
      next(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect('/cart');
    });
};

exports.deleteProduct = (req, res, next) => {
  console.log("got Here");
  const prodId = req.params.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.status('200').json({successfull: "Deleted product successfully!"})
    })
    .catch(err => {
      res.status('500').json({error: "An error occured!"})
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user
        },
        items: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.session.user._id })
    .then(orders => {
      // console.log(orders);
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};


exports.getInvoice = (req, res, next) => {
  Order.find({_id: req.params.orderId, "user.userId": req.user._id.toString()})
  .then(order=>{
    if(!order){
      return next("Unauthorized")
    }
    const invoiceName = "Invoice-"+req.params.orderId + ".pdf"
    const invoicePath = path.join("data", "Invoices", invoiceName)

    const pdfDoc = new PDFdocument()
    res.setHeader('Content-Type', "application/pdf")
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName +'"')
    pdfDoc.pipe(fs.createWriteStream(invoicePath))
    pdfDoc.pipe(res)

    pdfDoc.fontSize(20).text("Order - "+req.params.orderId)
    let totalPrice = 0
    order[0].items.forEach(prod=>{
      totalPrice += prod.quantity * prod.product.price
      pdfDoc.fontSize(15).text(`${prod.product.title} - ${prod.product.price} x ${prod.quantity}`)
    })
    pdfDoc.fontSize(20).text(`Total Price : ${totalPrice}`)
    pdfDoc.end()

    // const file = fs.createReadStream(invoicePath)
    
    // res.setHeader('Content-Type', "application/pdf")
    // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName +'"')

    // file.pipe(res)
    // fs.readFile(invoicePath, (err, data)=>{
    //   if(err){
    //     return next(err)
    //   }

    //   res.setHeader('Content-Type', "application/pdf")
    //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName +'"')
    //   res.send(data)
    // })
  })
}