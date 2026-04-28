// Seed data for Zonkomi Shop - embedded product and category data
// Used as fallback when database is unavailable (e.g., Vercel deployment)

export interface SeedProduct {
  id: string; name: string; slug: string; description: string; shortDesc: string | null
  price: number; originalPrice: number | null; condition: string; categoryId: string
  images: string; stock: number; rating: number; reviewCount: number; featured: boolean
  specs: string; brand: string | null; warranty: string; active: boolean; category?: SeedCategory
  sku: string
}

export interface SeedCategory {
  id: string; name: string; slug: string; description: string | null
  image: string | null; sortOrder: number; active: boolean; _count?: { products: number }
}

export const categories: SeedCategory[] = [
  { id: "cat-laptops", name: "Laptops", slug: "laptops", description: "Refurbished laptops for work and play", image: null, sortOrder: 1, active: true },
  { id: "cat-smartphones", name: "Smartphones", slug: "smartphones", description: "Quality refurbished phones", image: null, sortOrder: 2, active: true },
  { id: "cat-tablets", name: "Tablets", slug: "tablets", description: "Tablets at great prices", image: null, sortOrder: 3, active: true },
  { id: "cat-headphones", name: "Headphones", slug: "headphones", description: "Audio equipment", image: null, sortOrder: 4, active: true },
  { id: "cat-monitors", name: "Monitors", slug: "monitors", description: "Display solutions", image: null, sortOrder: 5, active: true },
  { id: "cat-desktops", name: "Desktops", slug: "desktops", description: "Desktop computers", image: null, sortOrder: 6, active: true },
  { id: "cat-cameras", name: "Cameras", slug: "cameras", description: "Photography equipment", image: null, sortOrder: 7, active: true },
  { id: "cat-gaming", name: "Gaming", slug: "gaming", description: "Gaming peripherals and consoles", image: null, sortOrder: 8, active: true },
]

const P = (id: string, name: string, slug: string, price: number, op: number, cat: string, img: string, stock: number, rating: number, feat: boolean, specs: string, brand: string, desc: string, short: string, cond: string, sku: string): SeedProduct => ({
  id, name, slug, price, originalPrice: op, categoryId: cat, images: `["${img}"]`, stock, rating, reviewCount: Math.floor(rating * 4), featured: feat, specs, brand, warranty: "90 Days Warranty", description: desc, shortDesc: short, condition: cond, active: true, sku
})

export const products: SeedProduct[] = [
  P("prod-dell-5520","Dell Latitude 5520 Laptop","dell-latitude-5520",899.99,1499.99,"cat-laptops","💻",8,4.5,true,'{"Processor":"Intel i7-1185G7","RAM":"16GB DDR4","Storage":"256GB SSD","Display":"15.6\\" FHD","Battery":"Up to 8 hours"}',"Dell","The Dell Latitude 5520 is a powerful business laptop featuring a 15.6-inch Full HD display, Intel Core i7-1185G7 processor, 16GB of RAM, and a fast 256GB SSD.",'15.6" FHD, Intel i7-1185G7, 16GB RAM, 256GB SSD',"Excellent","ZKS-LAP-0001"),
  P("prod-hp-840","HP EliteBook 840 G8","hp-elitebook-840-g8",749.99,1299.99,"cat-laptops","💻",12,4.3,true,'{"Processor":"Intel i5-1135G7","RAM":"8GB DDR4","Storage":"256GB SSD","Display":"14\\" FHD","Weight":"1.35 kg"}',"HP","A sleek and lightweight business laptop with excellent build quality.",'14" FHD, Intel i5-1135G7, 8GB RAM, 256GB SSD',"Good","ZKS-LAP-0002"),
  P("prod-thinkpad-x1","Lenovo ThinkPad X1 Carbon Gen 9","lenovo-thinkpad-x1-gen9",1299.99,2099.99,"cat-laptops","💻",5,4.8,true,'{"Processor":"Intel i7-1165G7","RAM":"16GB LPDDR4x","Storage":"512GB SSD","Display":"14\\" 2K","Weight":"1.13 kg"}',"Lenovo","The legendary ThinkPad X1 Carbon delivers premium performance in an ultralight package.",'14" 2K, Intel i7-1165G7, 16GB RAM, 512GB SSD',"Like New","ZKS-LAP-0003"),
  P("prod-macbook-m1",'Apple MacBook Pro 13" M1',"macbook-pro-13-m1",1099.99,1799.99,"cat-laptops","💻",6,4.9,true,'{"Processor":"Apple M1","RAM":"8GB Unified","Storage":"256GB SSD","Display":"13.3\\" Retina","Battery":"Up to 20 hours"}',"Apple","Experience the revolutionary Apple M1 chip in this certified refurbished MacBook Pro.",'13.3" Retina, Apple M1, 8GB RAM, 256GB SSD',"Excellent","ZKS-LAP-0004"),
  P("prod-iphone-13","iPhone 13 Pro 256GB","iphone-13-pro-256gb",699.99,1099.99,"cat-smartphones","📱",10,4.7,true,'{"Display":"6.1\\" Super Retina XDR","Chip":"A15 Bionic","Storage":"256GB","Camera":"Triple 12MP","Battery":"Up to 22 hours"}',"Apple","The iPhone 13 Pro features a stunning 6.1-inch Super Retina XDR display with ProMotion.",'6.1" Super Retina XDR, A15 Bionic, 256GB',"Excellent","ZKS-PHN-0001"),
  P("prod-samsung-s22","Samsung Galaxy S22 Ultra","samsung-galaxy-s22-ultra",799.99,1399.99,"cat-smartphones","📱",7,4.6,true,'{"Display":"6.8\\" Dynamic AMOLED 2X","Chip":"Snapdragon 8 Gen 1","Storage":"128GB","Camera":"108MP","Battery":"5000mAh"}',"Samsung","The Galaxy S22 Ultra combines premium design with powerful performance.",'6.8" Dynamic AMOLED, Snapdragon 8 Gen 1, 128GB',"Good","ZKS-PHN-0002"),
  P("prod-pixel-7","Google Pixel 7 Pro","google-pixel-7-pro",549.99,999.99,"cat-smartphones","📱",15,4.4,false,'{"Display":"6.7\\" LTPO OLED","Chip":"Google Tensor G2","Storage":"128GB","Camera":"50MP + 48MP + 12MP","Battery":"5000mAh"}',"Google","The Pixel 7 Pro delivers Google best AI-powered camera.",'6.7" LTPO OLED, Tensor G2, 128GB',"Like New","ZKS-PHN-0003"),
  P("prod-oneplus-11","OnePlus 11 5G","oneplus-11-5g",499.99,899.99,"cat-smartphones","📱",9,4.3,false,'{"Display":"6.7\\" 2K AMOLED","Chip":"Snapdragon 8 Gen 2","Storage":"256GB","Camera":"50MP + 48MP + 32MP","Battery":"5000mAh"}',"OnePlus","Flagship performance at a fraction of the price.",'6.7" AMOLED, Snapdragon 8 Gen 2, 256GB',"Good","ZKS-PHN-0004"),
  P("prod-ipad-air","iPad Air (5th Gen) 64GB","ipad-air-5-64gb",449.99,599.99,"cat-tablets","📲",8,4.6,true,'{"Display":"10.9\\" Liquid Retina","Chip":"Apple M1","Storage":"64GB","Camera":"12MP Wide","Weight":"461g"}',"Apple","The iPad Air with M1 chip delivers incredible performance.",'10.9" Liquid Retina, M1 chip, 64GB',"Excellent","ZKS-TAB-0001"),
  P("prod-galaxy-tab","Samsung Galaxy Tab S8+","samsung-galaxy-tab-s8-plus",549.99,999.99,"cat-tablets","📲",6,4.5,false,'{"Display":"12.4\\" Super AMOLED","Chip":"Snapdragon 8 Gen 1","Storage":"128GB","Camera":"13MP + 6MP","Battery":"10090mAh"}',"Samsung","A premium Android tablet with a gorgeous 12.4-inch Super AMOLED display.",'12.4" Super AMOLED, Snapdragon 8 Gen 1, 128GB',"Good","ZKS-TAB-0002"),
  P("prod-sony-xm5","Sony WH-1000XM5","sony-wh-1000xm5",249.99,399.99,"cat-headphones","🎧",20,4.8,true,'{"Driver":"30mm","Noise Cancelling":"Best in Class","Battery":"Up to 30 hours","Bluetooth":"5.2","Weight":"250g"}',"Sony","The Sony WH-1000XM5 sets the new standard for premium noise-cancelling headphones.","Industry-leading noise cancelling headphones","Like New","ZKS-AUD-0001"),
  P("prod-airpods-pro","Apple AirPods Pro (2nd Gen)","airpods-pro-2nd-gen",179.99,249.99,"cat-headphones","🎧",25,4.7,true,'{"Chip":"Apple H2","Noise Cancelling":"Active + Adaptive","Battery":"6 hours (30 with case)","Water Resistance":"IPX4"}',"Apple","The next generation of AirPods Pro with improved Active Noise Cancellation.","Active Noise Cancellation, Adaptive Transparency","Excellent","ZKS-AUD-0002"),
  P("prod-bose-qc45","Bose QuietComfort 45","bose-quietcomfort-45",199.99,329.99,"cat-headphones","🎧",12,4.4,false,'{"Driver":"Proprietary","Noise Cancelling":"Aware/Quiet modes","Battery":"Up to 24 hours","Bluetooth":"5.1","Weight":"240g"}',"Bose","Bose QuietComfort 45 headphones combine world-class noise cancellation with legendary Bose comfort.","Iconic noise cancelling, legendary comfort","Good","ZKS-AUD-0003"),
  P("prod-lg-27-4k",'LG UltraFine 27" 4K',"lg-ultrafine-27-4k",399.99,699.99,"cat-monitors","🖥️",5,4.5,true,'{"Display":"27\\" 4K UHD (3840x2160)","Panel":"IPS","HDR":"HDR400","Ports":"USB-C, HDMI, DisplayPort"}',"LG",'A stunning 27-inch 4K UHD monitor with IPS technology.','27" 4K UHD, IPS, USB-C, HDR400',"Excellent","ZKS-MON-0001"),
  P("prod-dell-u2722","Dell UltraSharp U2722D","dell-ultrasharp-u2722d",349.99,619.99,"cat-monitors","🖥️",8,4.4,false,'{"Display":"27\\" QHD (2560x1440)","Panel":"IPS","Color":"98% DCI-P3","Ports":"USB-C (90W), HDMI, DP"}',"Dell","The Dell UltraSharp U2722D delivers exceptional color accuracy.",'27" QHD, IPS, USB-C Hub, 98% DCI-P3',"Good","ZKS-MON-0002"),
  P("prod-hp-prodesk","HP ProDesk 400 G7 Desktop","hp-prodesk-400-g7",399.99,749.99,"cat-desktops","🖥️",4,4.2,false,'{"Processor":"Intel i5-10500","RAM":"8GB DDR4","Storage":"256GB SSD","Graphics":"Intel UHD 630"}',"HP","A reliable desktop PC for business and everyday use.","Intel i5-10500, 8GB RAM, 256GB SSD","Good","ZKS-DSK-0001"),
  P("prod-mac-mini","Apple Mac Mini M1","apple-mac-mini-m1",549.99,999.99,"cat-desktops","🖥️",6,4.7,true,'{"Processor":"Apple M1","RAM":"8GB Unified","Storage":"256GB SSD","Ports":"USB-C Thunderbolt, USB-A, HDMI"}',"Apple","The incredibly compact Mac Mini with M1 chip delivers desktop-class performance.","M1 chip, 8GB RAM, 256GB SSD","Like New","ZKS-DSK-0002"),
  P("prod-canon-r6","Canon EOS R6 Mark II","canon-eos-r6-ii",1799.99,2499.99,"cat-cameras","📷",3,4.9,true,'{"Sensor":"24.2MP Full-Frame CMOS","Autofocus":"Dual Pixel CMOS AF II","Video":"4K 60fps","Stabilization":"8 stops IBIS"}',"Canon","A professional full-frame mirrorless camera with incredible autofocus.","24.2MP Full-Frame Mirrorless, 4K 60fps","Excellent","ZKS-CAM-0001"),
  P("prod-sony-a7","Sony Alpha A7 III","sony-alpha-a7-iii",1299.99,1999.99,"cat-cameras","📷",4,4.6,false,'{"Sensor":"24.2MP Full-Frame Exmor R CMOS","Autofocus":"693-point phase-detection","Video":"4K HDR","Stabilization":"5-axis IBIS"}',"Sony","The Sony A7 III is a versatile full-frame mirrorless camera.","24.2MP Full-Frame, 693-point AF, 4K","Good","ZKS-CAM-0002"),
  P("prod-ps5","Sony PlayStation 5 Disc Edition","ps5-disc-edition",449.99,699.99,"cat-gaming","🎮",5,4.8,true,'{"CPU":"AMD Zen 2 (8-core)","GPU":"AMD RDNA 2 (10.28 TFLOPS)","Storage":"825GB Custom SSD","Output":"Up to 4K 120fps","Controller":"DualSense Wireless"}',"Sony","Experience next-generation gaming with the PlayStation 5.","Next-gen gaming console with disc drive","Like New","ZKS-GAM-0001"),
  P("prod-xbox","Xbox Series X 1TB","xbox-series-x-1tb",399.99,599.99,"cat-gaming","🎮",7,4.6,false,'{"CPU":"AMD Zen 2 (8-core)","GPU":"AMD RDNA 2 (12 TFLOPS)","Storage":"1TB Custom NVMe SSD","Output":"Up to 8K / 4K 120fps"}',"Microsoft","The most powerful Xbox ever with 12 TFLOPS of processing power.","Most powerful Xbox ever, 1TB SSD","Good","ZKS-GAM-0002"),
  P("prod-switch","Nintendo Switch OLED","nintendo-switch-oled",279.99,349.99,"cat-gaming","🎮",12,4.7,true,'{"Display":"7\\" OLED (1280x720)","CPU/GPU":"NVIDIA Custom Tegra","Storage":"64GB","Battery":"4.5 - 9 hours","Modes":"TV, Tabletop, Handheld"}',"Nintendo","The Nintendo Switch OLED model features a vibrant 7-inch OLED screen.",'7" OLED screen, enhanced audio, 64GB',"Excellent","ZKS-GAM-0003"),
]

export function getCategoriesWithCount(): SeedCategory[] {
  const counts: Record<string, number> = {}
  for (const p of products) { if (p.active) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1 }
  return categories.map((c) => ({ ...c, _count: { products: counts[c.id] || 0 } }))
}

export function getProductsWithCategory(): SeedProduct[] {
  const catMap: Record<string, SeedCategory> = {}
  for (const c of categories) catMap[c.id] = c
  return products.map((p) => ({ ...p, category: catMap[p.categoryId] }))
}

export function getProductBySlug(slug: string): SeedProduct | undefined {
  const catMap: Record<string, SeedCategory> = {}
  for (const c of categories) catMap[c.id] = c
  const product = products.find((p) => p.slug === slug)
  if (!product) return undefined
  return { ...product, category: catMap[product.categoryId] }
}
