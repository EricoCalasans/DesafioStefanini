const catalog = db.getSiblingDB("catalog");
const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "sku", "name", "currency", "priceCents", "active", "priceVersion", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" },
      sku: { bsonType: "string", minLength: 1, maxLength: 40, pattern: "^[^\\x00-\\x1F\\x7F]+$" },
      name: { bsonType: "string", minLength: 1, maxLength: 120, pattern: "^[^\\x00-\\x1F\\x7F]+$" },
      currency: { bsonType: "string", enum: ["BRL"] },
      priceCents: { bsonType: "long", minimum: NumberLong("1"), maximum: NumberLong("100000000") },
      active: { bsonType: "bool" },
      priceVersion: { bsonType: "int", minimum: 1 },
      updatedAt: { bsonType: "date" }
    }
  }
};

if (!catalog.getCollectionInfos({ name: "products" }).length) {
  catalog.createCollection("products", { validator, validationLevel: "strict", validationAction: "error" });
} else {
  catalog.runCommand({ collMod: "products", validator, validationLevel: "strict", validationAction: "error" });
}

catalog.products.createIndex({ sku: 1 }, { unique: true, name: "ux_products_sku" });
catalog.products.createIndex({ active: 1, _id: 1 }, { name: "ix_products_active_id" });

if (!catalog.getUser("catalog_runtime")) {
  catalog.createUser({ user: "catalog_runtime", pwd: process.env.CATALOG_RUNTIME_PASSWORD, roles: [{ role: "read", db: "catalog" }] });
}
if (!catalog.getUser("catalog_seed")) {
  catalog.createUser({ user: "catalog_seed", pwd: process.env.CATALOG_SEED_PASSWORD, roles: [{ role: "readWrite", db: "catalog" }] });
}

const seed = [
  { _id: "11111111-1111-4111-8111-111111111111", sku: "TEC-001", name: "Teclado", currency: "BRL", priceCents: NumberLong("20000"), active: true, priceVersion: NumberInt(1) },
  { _id: "22222222-2222-4222-8222-222222222222", sku: "MOU-001", name: "Mouse", currency: "BRL", priceCents: NumberLong("10000"), active: true, priceVersion: NumberInt(1) },
  { _id: "33333333-3333-4333-8333-333333333333", sku: "CAB-001", name: "Cabo", currency: "BRL", priceCents: NumberLong("101"), active: true, priceVersion: NumberInt(1) },
  { _id: "44444444-4444-4444-8444-444444444444", sku: "INA-001", name: "Produto Inativo", currency: "BRL", priceCents: NumberLong("5000"), active: false, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000001", sku: "MON-001", name: "Monitor 24 polegadas", currency: "BRL", priceCents: NumberLong("89900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000002", sku: "HDS-001", name: "Headset USB", currency: "BRL", priceCents: NumberLong("25900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000003", sku: "WEB-001", name: "Webcam Full HD", currency: "BRL", priceCents: NumberLong("31900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000004", sku: "HUB-001", name: "Hub USB-C 6 em 1", currency: "BRL", priceCents: NumberLong("24900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000005", sku: "SSD-001", name: "SSD externo 1 TB", currency: "BRL", priceCents: NumberLong("54900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000006", sku: "CAB-002", name: "Cabo USB-C 1 m", currency: "BRL", priceCents: NumberLong("4900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000007", sku: "CAB-003", name: "Cabo HDMI 2 m", currency: "BRL", priceCents: NumberLong("5900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000008", sku: "SUP-001", name: "Suporte para notebook", currency: "BRL", priceCents: NumberLong("12900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000009", sku: "FON-001", name: "Fonte USB-C 65 W", currency: "BRL", priceCents: NumberLong("15900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000010", sku: "TEC-002", name: "Teclado mecânico", currency: "BRL", priceCents: NumberLong("32900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000011", sku: "MOU-002", name: "Mouse sem fio", currency: "BRL", priceCents: NumberLong("17900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000012", sku: "PAD-001", name: "Mouse pad", currency: "BRL", priceCents: NumberLong("3900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000013", sku: "MIC-001", name: "Microfone USB", currency: "BRL", priceCents: NumberLong("21900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000014", sku: "SPE-001", name: "Caixa de som Bluetooth", currency: "BRL", priceCents: NumberLong("28900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000015", sku: "ADA-001", name: "Adaptador Ethernet USB", currency: "BRL", priceCents: NumberLong("9900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000016", sku: "ADA-002", name: "Adaptador USB-C para HDMI", currency: "BRL", priceCents: NumberLong("11900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000017", sku: "LAM-001", name: "Luminária de mesa", currency: "BRL", priceCents: NumberLong("8900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000018", sku: "BAG-001", name: "Mochila para notebook", currency: "BRL", priceCents: NumberLong("23900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000019", sku: "SUP-002", name: "Suporte articulado para monitor", currency: "BRL", priceCents: NumberLong("29900"), active: true, priceVersion: NumberInt(1) },
  { _id: "50000000-0000-4000-8000-000000000020", sku: "CAB-004", name: "Cabo de rede 5 m", currency: "BRL", priceCents: NumberLong("4500"), active: true, priceVersion: NumberInt(1) }
].map(product => ({ ...product, updatedAt: new Date("2026-10-21T12:00:00Z") }));

const seedUri = "mongodb://catalog_seed:" + encodeURIComponent(process.env.CATALOG_SEED_PASSWORD) + "@mongo:27017/catalog?authSource=catalog";
const seedCatalog = connect(seedUri).getSiblingDB("catalog");
for (const product of seed) {
  seedCatalog.products.updateOne({ _id: product._id }, { $setOnInsert: product }, { upsert: true });
}

const runtimeUri = "mongodb://catalog_runtime:" + encodeURIComponent(process.env.CATALOG_RUNTIME_PASSWORD) + "@mongo:27017/catalog?authSource=catalog";
const runtimeCatalog = connect(runtimeUri).getSiblingDB("catalog");
print("MongoDB catalog initialized: schema, indexes, seed user, and idempotent seed; " + runtimeCatalog.products.countDocuments({}) + " products visible to the runtime reader.");
