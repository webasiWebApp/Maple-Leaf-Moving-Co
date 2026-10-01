# Complete the Mapleleaf Moving booking experience

## Goal
Turn the current moving-company site into a seamless quote-to-booking experience, while applying the uploaded Canada artwork and corrected logo consistently.

## What I’ll build
- Apply the Canada artwork as a fixed site-wide background with strong dark/light overlays so every page remains easy to read.
- Add the corrected Maple Leaf Moving Co logo to the header and footer, and derive the browser icon from it.
- Update all history copy to “Established in 200” / “serving the GTA since 200,” exactly as requested.
- Build an instant quote flow covering addresses, home size, room-by-room inventory, stairs, extra services, move date, arrival window, contact details, and a live price range.
- Use Google Maps for address suggestions and real driving distance/time when the connected service is available, with a clear fallback if it is temporarily unavailable.
- Save submitted quotes to Lovable Cloud, including anonymous quote requests.
- Add account sign-in and a customer area for saved quotes, confirmed bookings, move details, inventory, and status updates.
- Add booking confirmation and digital agreement acceptance, while clearly showing deposits as unavailable until payments are enabled.
- Add contextual booking FAQs and trust details near the points where customers make decisions.

## Payment status
Online deposits cannot be activated yet because built-in payments require a Pro plan or higher. The booking experience will preserve the calculated deposit and pending-payment state, ready for payment activation after upgrade.

## Technical details
- Reuse the existing quote calculator and Google Maps server functions.
- Use authenticated server functions for customer data and row-level access controls already present in Lovable Cloud.
- Keep anonymous quote submission limited to non-account-owned quote rows.
- Add unique page titles and social metadata for every new page.
- Verify the complete flow on desktop and mobile, including readability over the new background.
