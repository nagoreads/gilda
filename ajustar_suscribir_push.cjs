const fs = require("fs");
let code = fs.readFileSync("src/components/SuscribirPush.jsx", "utf8");

code = code.replace(
  "const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;",
  "const publicVapidKey = import.meta.env.VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY;"
);

fs.writeFileSync("src/components/SuscribirPush.jsx", code);
console.log("✅ SuscribirPush.jsx actualizado para usar VAPID_PUBLIC_KEY.");
