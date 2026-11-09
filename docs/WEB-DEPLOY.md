# Putting Who Made This on usewmt.com

For the owner. You deploy; the repo is ready. Nothing here needs a developer. Decided in R-127 (the web app is this repo's own web build) and R-128.

## 1. Make the Vercel project

1. In Vercel, choose Add New, then Project, then import the GitHub repo `MOXN-AFRICA/wawu-wmt-mobile`.
2. Production branch: `main`. (Until the web work is merged, pick the branch you want live.)
3. Leave the settings as they come: the repo's `vercel.json` sets the install command (`npm ci`), the build command (`npm run web:export`) and the output folder (`dist`). Framework preset: Other.
4. Open Environment Variables and add these two for Production (and Preview if you want preview links to work):
   - `EXPO_PUBLIC_API_URL` = `https://api.wawuafrica.com`
   - `EXPO_PUBLIC_ID_URL` = `https://id.wawuafrica.com`

   They are written into the app when it is built, so change them and redeploy, never just save. If you leave them out, the app falls back to those same two addresses.
5. Deploy. The build takes a few minutes. Open the `.vercel.app` address it gives you and check the app opens.

## 2. Point usewmt.com at it

1. Project, Settings, Domains, add `usewmt.com` (and `www.usewmt.com`, set to redirect to `usewmt.com`).
2. Vercel shows the DNS records to set. At wherever usewmt.com is registered, add them (an `A` record for the bare domain, a `CNAME` for `www`). Vercel turns on https by itself once they resolve.

## 3. Tell the servers about usewmt.com

The browser calls the servers directly, so each one must list `https://usewmt.com` (exactly that, no slash at the end). Until you do, sign-in and every call fail in the browser with no message that explains why.

| Where | Setting | Set it to |
|---|---|---|
| The Hub (api.wawuafrica.com) | `CORS_ORIGIN` | add `https://usewmt.com` to the list; keep what is there. Restart the Hub. The same list decides where hosted payment links may send people back to |
| WAWU ID (id.wawuafrica.com) | allowed origins (`ALLOWED_ORIGINS` in the stack scripts; whoever runs WAWU ID confirms the name) | add `https://usewmt.com` |
| The media bucket (Spaces, `wawu-media`) | CORS rules | allow origin `https://usewmt.com`, methods `GET`, `HEAD`, `PUT`, all headers (at least `Content-Type`), so a browser can upload a photo or video and see images and video |
| The Hub | `NUVION_LIVENESS_REDIRECT_ORIGINS` | add `https://usewmt.com`, so the hosted selfie page can send a person back to the web app |
| The Hub | `ADD_MONEY_RETURN_URL` | the return page opens `wawu://add-money/status` today, which a browser cannot open. Leave it for the phone app; the web app's add-money flow does not use it. Tell the lead if you want it to point at usewmt.com |

## 4. Things to know

- Links made on usewmt.com (invites, profiles, rooms, content, receipts, the selfie return) name usewmt.com. The phone app still sends wawuafrica.com links.
- Emails (activation, forgot password, "Secure my account") still link to wawuafrica.com until you rule otherwise (R-127).
- The theme song is still fetched from `https://wawuafrica.com/wawu-theme.mp3`. If wawuafrica.com is ever taken down, move the file and tell the lead.
- Nobody is signed in on usewmt.com at first: it has its own storage, separate from wawuafrica.com.
- The page's security rules (`Content-Security-Policy` in `vercel.json`) allow only: the app itself, the Hub, WAWU ID, DigitalOcean Spaces and Amazon S3 for pictures and video, `wawuafrica.com` for the song, and `fastly.jsdelivr.net` for the QR-scanner helper. If you move the bucket to another provider, the lead updates that file.
- The Hub allows 20 calls a second and 200 a minute for each address. Many people on one shared network can see "too many requests".
- A refresh or a pasted link on any page opens that page: `vercel.json` sends every path that is not a real file to the app.
