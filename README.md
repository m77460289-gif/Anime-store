# NIGA — Static preview

This repository contains a static HTML/CSS/JavaScript preview of the public-facing NIGA anime shop.

## Files
- `index.html`: homepage with products, gallery, about, FAQ and contact sections
- `assets/css/style.css`: responsive styles
- `assets/js/main.js`: mobile navigation, product search, demo cart and FAQ behavior
- `assets/images/`: selected product images
- `pages/`: reserved for future standalone pages

## Publish with GitHub Pages
Open **Settings → Pages**, select **Deploy from a branch**, choose branch `main` and folder `/ (root)`, then save. GitHub will show the published URL after deployment.

## Limitations
This is only a static front end. GitHub Pages does not run PHP or WordPress, so real login, checkout, order records, inventory, payment and administration are not available here. The cart and contact form are browser-only demonstrations. A live store needs WordPress/WooCommerce and a database on PHP/MySQL hosting.

## Security
This repository is public. WordPress installation files, plugins, PHP theme source, SQL database, configuration, secrets, logs and order data have intentionally not been copied here.