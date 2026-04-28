import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const categories = [
  { name: 'Laptops', slug: 'laptops', sortOrder: 1, description: 'Refurbished laptops for work and play' },
  { name: 'Smartphones', slug: 'smartphones', sortOrder: 2, description: 'Quality refurbished phones' },
  { name: 'Tablets', slug: 'tablets', sortOrder: 3, description: 'Tablets at great prices' },
  { name: 'Headphones', slug: 'headphones', sortOrder: 4, description: 'Audio equipment' },
  { name: 'Monitors', slug: 'monitors', sortOrder: 5, description: 'Display solutions' },
  { name: 'Desktops', slug: 'desktops', sortOrder: 6, description: 'Desktop computers' },
  { name: 'Cameras', slug: 'cameras', sortOrder: 7, description: 'Photography equipment' },
  { name: 'Gaming', slug: 'gaming', sortOrder: 8, description: 'Gaming peripherals and consoles' },
]

const products = [
  { name: 'Dell Latitude 5520 Laptop', slug: 'dell-latitude-5520', categoryId: 'Laptops', price: 899.99, originalPrice: 1499.99, condition: 'Excellent', brand: 'Dell', featured: true, stock: 8, rating: 4.5, reviewCount: 24, shortDesc: '15.6" FHD, Intel i7-1185G7, 16GB RAM, 256GB SSD', description: 'The Dell Latitude 5520 is a powerful business laptop featuring a 15.6-inch Full HD display, Intel Core i7-1185G7 processor, 16GB of RAM, and a fast 256GB SSD. Perfect for professionals who need reliability and performance on the go.', images: '["💻"]', specs: '{"Processor": "Intel i7-1185G7", "RAM": "16GB DDR4", "Storage": "256GB SSD", "Display": "15.6\\" FHD (1920x1080)", "Battery": "Up to 8 hours"}' },
  { name: 'HP EliteBook 840 G8', slug: 'hp-elitebook-840-g8', categoryId: 'Laptops', price: 749.99, originalPrice: 1299.99, condition: 'Good', brand: 'HP', featured: true, stock: 12, rating: 4.3, reviewCount: 18, shortDesc: '14" FHD, Intel i5-1135G7, 8GB RAM, 256GB SSD', description: 'A sleek and lightweight business laptop with excellent build quality. The HP EliteBook 840 G8 delivers reliable performance with an Intel i5 processor, 8GB RAM, and fast SSD storage.', images: '["💻"]', specs: '{"Processor": "Intel i5-1135G7", "RAM": "8GB DDR4", "Storage": "256GB SSD", "Display": "14\\" FHD (1920x1080)", "Weight": "1.35 kg"}' },
  { name: 'Lenovo ThinkPad X1 Carbon Gen 9', slug: 'lenovo-thinkpad-x1-gen9', categoryId: 'Laptops', price: 1299.99, originalPrice: 2099.99, condition: 'Like New', brand: 'Lenovo', featured: true, stock: 5, rating: 4.8, reviewCount: 42, shortDesc: '14" 2K, Intel i7-1165G7, 16GB RAM, 512GB SSD', description: 'The legendary ThinkPad X1 Carbon delivers premium performance in an ultralight package. Features a stunning 14-inch 2K display, Intel i7 processor, and all-day battery life.', images: '["💻"]', specs: '{"Processor": "Intel i7-1165G7", "RAM": "16GB LPDDR4x", "Storage": "512GB SSD", "Display": "14\\" 2K (2560x1440)", "Weight": "1.13 kg"}' },
  { name: 'Apple MacBook Pro 13" M1', slug: 'macbook-pro-13-m1', categoryId: 'Laptops', price: 1099.99, originalPrice: 1799.99, condition: 'Excellent', brand: 'Apple', featured: true, stock: 6, rating: 4.9, reviewCount: 67, shortDesc: '13.3" Retina, Apple M1, 8GB RAM, 256GB SSD', description: 'Experience the revolutionary Apple M1 chip in this certified refurbished MacBook Pro. Incredible performance, all-day battery life, and a stunning Retina display.', images: '["💻"]', specs: '{"Processor": "Apple M1", "RAM": "8GB Unified", "Storage": "256GB SSD", "Display": "13.3\\" Retina (2560x1600)", "Battery": "Up to 20 hours"}' },
  { name: 'iPhone 13 Pro 256GB', slug: 'iphone-13-pro-256gb', categoryId: 'Smartphones', price: 699.99, originalPrice: 1099.99, condition: 'Excellent', brand: 'Apple', featured: true, stock: 10, rating: 4.7, reviewCount: 55, shortDesc: '6.1" Super Retina XDR, A15 Bionic, 256GB', description: 'The iPhone 13 Pro features a stunning 6.1-inch Super Retina XDR display with ProMotion, the powerful A15 Bionic chip, and an advanced triple-camera system.', images: '["📱"]', specs: '{"Display": "6.1\\" Super Retina XDR", "Chip": "A15 Bionic", "Storage": "256GB", "Camera": "Triple 12MP", "Battery": "Up to 22 hours"}' },
  { name: 'Samsung Galaxy S22 Ultra', slug: 'samsung-galaxy-s22-ultra', categoryId: 'Smartphones', price: 799.99, originalPrice: 1399.99, condition: 'Good', brand: 'Samsung', featured: true, stock: 7, rating: 4.6, reviewCount: 38, shortDesc: '6.8" Dynamic AMOLED, Snapdragon 8 Gen 1, 128GB', description: 'The Galaxy S22 Ultra combines premium design with powerful performance. Features a stunning 6.8-inch Dynamic AMOLED display, S Pen, and an incredible 108MP camera.', images: '["📱"]', specs: '{"Display": "6.8\\" Dynamic AMOLED 2X", "Chip": "Snapdragon 8 Gen 1", "Storage": "128GB", "Camera": "108MP + 12MP + 10MP + 10MP", "Battery": "5000mAh"}' },
  { name: 'Google Pixel 7 Pro', slug: 'google-pixel-7-pro', categoryId: 'Smartphones', price: 549.99, originalPrice: 999.99, condition: 'Like New', brand: 'Google', featured: false, stock: 15, rating: 4.5, reviewCount: 29, shortDesc: '6.7" LTPO OLED, Tensor G2, 128GB', description: "The Pixel 7 Pro delivers Google's best AI-powered camera in a stunning design.", images: '["📱"]', specs: '{"Display": "6.7\\" LTPO OLED", "Chip": "Google Tensor G2", "Storage": "128GB", "Camera": "50MP + 48MP + 12MP", "Battery": "5000mAh"}' },
  { name: 'OnePlus 11 5G', slug: 'oneplus-11-5g', categoryId: 'Smartphones', price: 499.99, originalPrice: 899.99, condition: 'Good', brand: 'OnePlus', featured: false, stock: 9, rating: 4.4, reviewCount: 16, shortDesc: '6.7" AMOLED, Snapdragon 8 Gen 2, 256GB', description: 'Flagship performance at a fraction of the price. The OnePlus 11 features a beautiful AMOLED display, Snapdragon 8 Gen 2, and Hasselblad camera system.', images: '["📱"]', specs: '{"Display": "6.7\\" 2K AMOLED", "Chip": "Snapdragon 8 Gen 2", "Storage": "256GB", "Camera": "50MP + 48MP + 32MP", "Battery": "5000mAh"}' },
  { name: 'iPad Air (5th Gen) 64GB', slug: 'ipad-air-5-64gb', categoryId: 'Tablets', price: 449.99, originalPrice: 599.99, condition: 'Excellent', brand: 'Apple', featured: true, stock: 8, rating: 4.6, reviewCount: 31, shortDesc: '10.9" Liquid Retina, M1 chip, 64GB', description: 'The iPad Air with M1 chip delivers incredible performance in a thin and light design. Perfect for creativity, productivity, and entertainment.', images: '["📲"]', specs: '{"Display": "10.9\\" Liquid Retina", "Chip": "Apple M1", "Storage": "64GB", "Camera": "12MP Wide", "Weight": "461g"}' },
  { name: 'Samsung Galaxy Tab S8+', slug: 'samsung-galaxy-tab-s8-plus', categoryId: 'Tablets', price: 549.99, originalPrice: 999.99, condition: 'Good', brand: 'Samsung', featured: false, stock: 6, rating: 4.3, reviewCount: 19, shortDesc: '12.4" Super AMOLED, Snapdragon 8 Gen 1, 128GB', description: 'A premium Android tablet with a gorgeous 12.4-inch Super AMOLED display, S Pen included, and powerful Snapdragon performance.', images: '["📲"]', specs: '{"Display": "12.4\\" Super AMOLED", "Chip": "Snapdragon 8 Gen 1", "Storage": "128GB", "Camera": "13MP + 6MP", "Battery": "10090mAh"}' },
  { name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', categoryId: 'Headphones', price: 249.99, originalPrice: 399.99, condition: 'Like New', brand: 'Sony', featured: true, stock: 20, rating: 4.8, reviewCount: 82, shortDesc: 'Industry-leading noise cancelling headphones', description: 'The Sony WH-1000XM5 sets the new standard for premium noise-cancelling headphones with exceptional sound quality, improved ANC, and all-day comfort.', images: '["🎧"]', specs: '{"Driver": "30mm", "Noise Cancelling": "Yes (Best in Class)", "Battery": "Up to 30 hours", "Bluetooth": "5.2", "Weight": "250g"}' },
  { name: 'Apple AirPods Pro (2nd Gen)', slug: 'airpods-pro-2nd-gen', categoryId: 'Headphones', price: 179.99, originalPrice: 249.99, condition: 'Excellent', brand: 'Apple', featured: true, stock: 25, rating: 4.7, reviewCount: 95, shortDesc: 'Active Noise Cancellation, Adaptive Transparency', description: 'The next generation of AirPods Pro with improved Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio.', images: '["🎧"]', specs: '{"Chip": "Apple H2", "Noise Cancelling": "Active + Adaptive Transparency", "Battery": "Up to 6 hours (30 with case)", "Water Resistance": "IPX4", "Spatial Audio": "Personalized"}' },
  { name: 'Bose QuietComfort 45', slug: 'bose-quietcomfort-45', categoryId: 'Headphones', price: 199.99, originalPrice: 329.99, condition: 'Good', brand: 'Bose', featured: false, stock: 12, rating: 4.4, reviewCount: 47, shortDesc: 'Iconic noise cancelling, legendary comfort', description: 'Bose QuietComfort 45 headphones combine world-class noise cancellation with legendary Bose comfort.', images: '["🎧"]', specs: '{"Driver": "Proprietary", "Noise Cancelling": "Yes (Aware/Quiet modes)", "Battery": "Up to 24 hours", "Bluetooth": "5.1", "Weight": "240g"}' },
  { name: 'LG UltraFine 27" 4K', slug: 'lg-ultrafine-27-4k', categoryId: 'Monitors', price: 399.99, originalPrice: 699.99, condition: 'Excellent', brand: 'LG', featured: true, stock: 5, rating: 4.5, reviewCount: 22, shortDesc: '27" 4K UHD, IPS, USB-C, HDR400', description: 'A stunning 27-inch 4K UHD monitor with IPS technology, USB-C connectivity, and HDR400 support.', images: '["🖥️"]', specs: '{"Display": "27\\" 4K UHD (3840x2160)", "Panel": "IPS", "HDR": "HDR400", "Ports": "USB-C, HDMI, DisplayPort", "Response Time": "5ms"}' },
  { name: 'Dell UltraSharp U2722D', slug: 'dell-ultrasharp-u2722d', categoryId: 'Monitors', price: 349.99, originalPrice: 619.99, condition: 'Good', brand: 'Dell', featured: false, stock: 8, rating: 4.3, reviewCount: 15, shortDesc: '27" QHD, IPS, USB-C Hub, 98% DCI-P3', description: 'The Dell UltraSharp U2722D delivers exceptional color accuracy with 98% DCI-P3 coverage.', images: '["🖥️"]', specs: '{"Display": "27\\" QHD (2560x1440)", "Panel": "IPS", "Color": "98% DCI-P3", "Ports": "USB-C (90W), HDMI, DP", "Response Time": "5ms"}' },
  { name: 'HP ProDesk 400 G7 Desktop', slug: 'hp-prodesk-400-g7', categoryId: 'Desktops', price: 399.99, originalPrice: 749.99, condition: 'Good', brand: 'HP', featured: false, stock: 4, rating: 4.1, reviewCount: 12, shortDesc: 'Intel i5-10500, 8GB RAM, 256GB SSD', description: 'A reliable desktop PC for business and everyday use.', images: '["🖥️"]', specs: '{"Processor": "Intel i5-10500", "RAM": "8GB DDR4", "Storage": "256GB SSD", "Graphics": "Intel UHD 630", "Form Factor": "Desktop Tower"}' },
  { name: 'Apple Mac Mini M1', slug: 'apple-mac-mini-m1', categoryId: 'Desktops', price: 549.99, originalPrice: 999.99, condition: 'Like New', brand: 'Apple', featured: true, stock: 6, rating: 4.7, reviewCount: 34, shortDesc: 'M1 chip, 8GB RAM, 256GB SSD', description: 'The incredibly compact Mac Mini with M1 chip delivers desktop-class performance.', images: '["🖥️"]', specs: '{"Processor": "Apple M1", "RAM": "8GB Unified", "Storage": "256GB SSD", "Ports": "USB-C (Thunderbolt), USB-A, HDMI", "Weight": "1.29 kg"}' },
  { name: 'Canon EOS R6 Mark II', slug: 'canon-eos-r6-ii', categoryId: 'Cameras', price: 1799.99, originalPrice: 2499.99, condition: 'Excellent', brand: 'Canon', featured: true, stock: 3, rating: 4.8, reviewCount: 28, shortDesc: '24.2MP Full-Frame Mirrorless, 4K 60fps', description: 'A professional full-frame mirrorless camera with incredible autofocus, in-body stabilization, and 4K 60fps video recording.', images: '["📷"]', specs: '{"Sensor": "24.2MP Full-Frame CMOS", "Autofocus": "Dual Pixel CMOS AF II", "Video": "4K 60fps / Full HD 180fps", "Stabilization": "8 stops IBIS", "Weight": "670g"}' },
  { name: 'Sony Alpha A7 III', slug: 'sony-alpha-a7-iii', categoryId: 'Cameras', price: 1299.99, originalPrice: 1999.99, condition: 'Good', brand: 'Sony', featured: false, stock: 4, rating: 4.6, reviewCount: 35, shortDesc: '24.2MP Full-Frame, 693-point AF, 4K', description: 'The Sony A7 III is a versatile full-frame mirrorless camera with excellent autofocus.', images: '["📷"]', specs: '{"Sensor": "24.2MP Full-Frame Exmor R CMOS", "Autofocus": "693-point phase-detection", "Video": "4K HDR (HLG)", "Stabilization": "5-axis IBIS", "Battery": "710 shots"}' },
  { name: 'Sony PlayStation 5 Disc Edition', slug: 'ps5-disc-edition', categoryId: 'Gaming', price: 449.99, originalPrice: 699.99, condition: 'Like New', brand: 'Sony', featured: true, stock: 5, rating: 4.7, reviewCount: 72, shortDesc: 'Next-gen gaming console with disc drive', description: 'Experience next-generation gaming with the PlayStation 5. Features ultra-high speed SSD, ray tracing, 4K gaming, and the revolutionary DualSense controller.', images: '["🎮"]', specs: '{"CPU": "AMD Zen 2 (8-core)", "GPU": "AMD RDNA 2 (10.28 TFLOPS)", "Storage": "825GB Custom SSD", "Output": "Up to 4K 120fps", "Controller": "DualSense Wireless"}' },
  { name: 'Xbox Series X 1TB', slug: 'xbox-series-x-1tb', categoryId: 'Gaming', price: 399.99, originalPrice: 599.99, condition: 'Good', brand: 'Microsoft', featured: false, stock: 7, rating: 4.5, reviewCount: 48, shortDesc: 'Most powerful Xbox ever, 1TB SSD', description: 'The most powerful Xbox ever with 12 TFLOPS of processing power, 1TB custom SSD, and true 4K gaming.', images: '["🎮"]', specs: '{"CPU": "AMD Zen 2 (8-core)", "GPU": "AMD RDNA 2 (12 TFLOPS)", "Storage": "1TB Custom NVMe SSD", "Output": "Up to 8K / 4K 120fps", "Backwards Compatibility": "Thousands of games"}' },
  { name: 'Nintendo Switch OLED', slug: 'nintendo-switch-oled', categoryId: 'Gaming', price: 279.99, originalPrice: 349.99, condition: 'Excellent', brand: 'Nintendo', featured: true, stock: 12, rating: 4.6, reviewCount: 56, shortDesc: '7" OLED screen, enhanced audio, 64GB', description: 'The Nintendo Switch OLED model features a vibrant 7-inch OLED screen, wide adjustable stand, enhanced audio, and 64GB of internal storage.', images: '["🎮"]', specs: '{"Display": "7\\" OLED (1280x720)", "CPU/GPU": "NVIDIA Custom Tegra", "Storage": "64GB", "Battery": "4.5 - 9 hours", "Modes": "TV, Tabletop, Handheld"}' },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.review.deleteMany()
  await db.cartItem.deleteMany()
  await db.wishlist.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await db.user.create({
    data: {
      email: 'admin@zonkomishop.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
      phone: '+233201234567',
      address: 'Admin HQ, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zipCode: 'GA-123',
      country: 'GH',
    },
  })
  console.log(`Created admin: ${admin.email} (password: admin123)`)

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10)
  const demo = await db.user.create({
    data: {
      email: 'demo@zonkomishop.com',
      name: 'Kwame Asante',
      password: demoPassword,
      role: 'customer',
      phone: '+233241234567',
      address: '12 Ring Road Central, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zipCode: 'GA-123',
      country: 'GH',
    },
  })
  console.log(`Created demo user: ${demo.email} (password: demo123)`)

  // Create categories
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const created = await db.category.create({ data: cat })
    categoryMap[cat.name] = created.id
    console.log(`Created category: ${cat.name}`)
  }

  // Create products
  for (const prod of products) {
    const categoryId = categoryMap[prod.categoryId]
    if (!categoryId) {
      console.warn(`Skipping product "${prod.name}" - category "${prod.categoryId}" not found`)
      continue
    }
    await db.product.create({
      data: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        shortDesc: prod.shortDesc,
        price: prod.price,
        originalPrice: prod.originalPrice,
        condition: prod.condition,
        categoryId,
        images: prod.images,
        stock: prod.stock,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        featured: prod.featured,
        specs: prod.specs,
        brand: prod.brand,
        warranty: '90 Days Warranty',
      },
    })
    console.log(`Created product: ${prod.name}`)
  }

  console.log('\nSeeding complete!')
  console.log('--- Account Credentials ---')
  console.log('Admin: admin@zonkomishop.com / admin123')
  console.log('Demo:  demo@zonkomishop.com / demo123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
