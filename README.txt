SOUNDIFY REDESIGN — READY TO DEPLOY

FILES
- index.html
- products.html
- styles.css
- script.js
- hero-speaker-left.png
- hero-speaker-right.png

WHAT CHANGED
- Full visual redesign with a premium black / off-white / electric-lime design system.
- New conversion-first hero using the two supplied speaker images.
- Mobile-first responsive layouts and 44px+ interactive targets.
- Event-first discovery section for parties, weddings, corporate events and DJ/live music.
- Two booking paths: complete setup help vs individual equipment rental.
- Redesigned product cards and a new searchable/filterable product catalogue.
- Improved packages, process, trust and CTA sections.
- Cart now persists between index.html and products.html using localStorage.
- Improved cart drawer, checkout modal, keyboard Escape handling and focus trapping.
- Reduced-motion support for accessibility.

BOOKING FLOW
1. Customer adds equipment to cart.
2. Cart persists if they move between the home and catalogue pages.
3. Customer enters contact and event details.
4. Customer chooses UPI / Google Pay or Razorpay.
5. Customer sends the complete booking request on WhatsApp.
6. Soundify manually verifies stock, payment and delivery before final confirmation.

IMPORTANT BEFORE GOING LIVE
Open script.js and replace:
- WHATSAPP_NUMBER
- UPI_ID
- RAZORPAY_PAYMENT_LINK

CURRENT WHATSAPP NUMBER
971544685090

DEPLOYMENT
Replace the existing website files with these files in the same public/root folder. Keep all six files together so the image, CSS and JavaScript paths continue to work.


CALLBACK AND CONTACT UPDATE
- Request a call section appears directly below the homepage hero.
- Enter a 10-digit Indian mobile number; the form opens WhatsApp with a prepared callback request. The visitor must tap Send in WhatsApp.
- Floating Call and WhatsApp buttons appear on the home and equipment pages.
- Contact destinations use WHATSAPP_NUMBER in script.js (currently 971544685090).
- Upload every file in this folder together, preserving these filenames.
- No backend callback storage or automated calling is included.
