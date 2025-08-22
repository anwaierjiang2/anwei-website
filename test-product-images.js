const axios = require('axios');

async function testProductImages() {
  try {
    // 获取产品列表
    const response = await axios.get('http://localhost:5000/api/products');
    console.log('产品列表响应:', response.status);
    
    // 检查是否有产品
    if (response.data && response.data.products && response.data.products.length > 0) {
      const products = response.data.products;
      console.log(`找到 ${products.length} 个产品`);
      
      // 打印前3个产品的图片URL信息
      products.slice(0, 3).forEach((product, index) => {
        console.log(`\n产品 ${index + 1}: ${product.name}`);
        console.log('主图片URL:', product.images?.main);
        console.log('图库图片数量:', product.images?.gallery?.length || 0);
        if (product.images?.gallery && product.images.gallery.length > 0) {
          console.log('第一张图库图片URL:', product.images.gallery[0]);
        }
        
        // 测试图片URL是否可访问
        if (product.images?.main) {
          testImageAccess(product.images.main, '主图片');
        }
      });
    } else {
      console.log('没有找到产品数据');
    }
  } catch (error) {
    console.error('获取产品列表错误:', error.message);
  }
}

async function testImageAccess(imageUrl, type) {
  try {
    // 使用HEAD请求测试图片URL是否可访问
    const response = await axios.head(imageUrl);
    console.log(`${type} 可访问: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error(`${type} 访问失败: ${error.message}`);
  }
}

testProductImages();