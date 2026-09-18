# Refresh the background, logo, and contact experience

## What I’ll change
- Replace the current red Canada Day wallpaper with the newly attached colourful maple-leaf artwork across every page, retaining strong light overlays for readable text.
- Replace the existing company logo in headers and footers with the newly attached red maple-leaf image and size/crop it cleanly at all screen sizes.
- Add a dedicated Contact Us page with 207 Weston Road, Toronto, ON M6N 4Z3, the existing phone number and email, and a working inquiry form.
- Update homepage and shared navigation Contact links to open the new contact page.
- Add page-specific search and social metadata for the contact page.
- Verify the homepage, quote flow, sign-in, contact form, and customer-area redirect without browser or runtime errors.

## Technical details
- Store both uploaded images through the existing CDN asset flow and reference their generated asset pointers.
- Keep the contact form frontend-only unless an existing safe message-storage pattern already exists; submitting will provide a clear confirmation without inventing delivery infrastructure.
- Preserve all existing quote, booking, and customer-area behavior.
