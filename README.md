# Hosirx app

Static files. Serve the folder over http(s) (for example `npx serve .`) and open `index.html`.
Video and voice calls need https (or localhost) for camera and microphone access.

Files: `index.html` (customer app and sign-in) · `partners.html` (pharmacy and hospital onboarding and dashboards, embedded by index.html) · `hs-core.js` (listings, partner-set fees, stock, orders, payment gateway, wallet ledger) · `hs-room.js` (consultation room: video, voice, chat).

## Try it
Sign-in screen > "Try a demo account" > Customer, Pharmacy or Hospital. Open two tabs to see both sides at once (each tab keeps its own login): book or order as the customer, and watch the pharmacy or hospital dashboard receive it live. Test card: 4084 0840 8408 4081, any future date, CVV 408. Card ending 0002 is declined.

## What is real and what is demo
- Payment gateway: demo checkout (card, bank transfer, USSD). To go live set `HS.config.paystackKey` in `hs-core.js` and verify every transaction on your server before confirming an order or booking.
- Backend: `hs-core.js` keeps listings, fees, stock, orders and bookings in localStorage so the app and the dashboards talk to each other on one browser. Replace the "DATA LAYER" functions with API calls.
- Calls: WebRTC is real. Signalling uses BroadcastChannel, so two tabs of one browser connect. For calls across devices add a signalling server and a TURN server (or Agora, Twilio, Daily) in `hs-room.js`.
- Sign-in codes are shown on screen. Connect an SMS or email service. Partner approval is simulated.
- Set `DEMO_ACCOUNTS=false` in `index.html` to remove the demo buttons.

## Finding a pharmacy
The Pharmacy tab starts with two buttons, State and Community or area. The starting choice comes from the customer's saved choice or their delivery address, and the choice is remembered. Pharmacies in that place appear as a sliding row of cards (name, logo, rating, distance, hours, delivery fee, number of medicines, open or closed). Tapping a card opens a full-page sheet with the pharmacy's name, logo and inventory, grouped by category, with Add buttons and a Consult button. Closed pharmacies can be browsed but not ordered from. Switching pharmacy with items in the cart asks first, then clears the cart.
- Areas: `HS.AREAS` in `hs-core.js` lists the common areas of 11 states. Any area a partner registers is added automatically, so the lists grow as pharmacies join. All 36 states and the FCT can be selected.
- Partners: the application form now asks for State and Community or area, and the listing carries both. Partners published before this update appear again the next time they open their dashboard.
- Logos: a listing shows `logo` (an image URL) when it has one, otherwise a coloured tile with the pharmacy's initials. Add a logo upload to the partner profile to use real logos.
- Demo data: `hs-core.js` has 11 demo pharmacies across Lagos, FCT Abuja, Rivers and Oyo, each with its own stock and prices. Only HealthPlus (p1) has a live demo dashboard.

## Wallet, payouts and history
- **Customers:** Wallet tab. Fund by card, bank transfer or USSD, pay for orders and bookings from the wallet at checkout, see every transaction (funding, payments, refunds) with receipts. A pharmacy declining an order refunds the customer to the wallet automatically.
- **Pharmacies and hospitals:** Earnings tab. Item sales, consultation fees and appointment fees are credited when the job is completed (order delivered, consultation or visit completed). Partners see available and pending balance, withdraw to a saved bank account, and follow each payout from Processing to Paid.
- **Ledger:** `HS.wallet` in `hs-core.js`. Balances are always the sum of the ledger, and every credit or refund carries a reference so the same order can never be credited or refunded twice. Limits (`minFund`, `maxFund`, `maxBalance`, `minPayout`) are in `HS.config.wallet`.
- **Demo only:** the ledger is in localStorage and no money moves. Before going live:
  1. Do not hold customer money yourself. In Nigeria only a CBN-licensed Mobile Money Operator may hold customer funds. Use a licensed wallet or virtual-account provider and keep the ledger, balances and payouts on your server.
  2. Verify every funding on your server before crediting a wallet, and run payouts through your provider's transfer API with account-name verification.
  3. Set funding and balance limits to match your provider's KYC tiers, and add KYC, transaction-dispute and reconciliation processes.
  4. Get legal advice on licensing and on how marketplace settlement should be structured.
