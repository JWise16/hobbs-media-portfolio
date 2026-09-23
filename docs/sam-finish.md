# Hobbs Media Co. site: finishing steps for Sam

You now own the hosting (Vercel) and the domain (Namecheap). Three short
jobs remain on your side. The first two you can do today; the third waits
for Jonny's go-ahead.

**Doing this on a phone:** both sites work in Safari or Chrome, but their
menus fold up on a small screen. If a tab or button named below is not
visible, look for a menu icon (three lines or three dots) near the top, or
turn your phone sideways. In Safari you can also tap the "aA" in the address
bar and choose **Request Desktop Website** to get the full layout.

## 1. Point the domain at the site (Namecheap, about 5 minutes)

1. Sign in at https://www.namecheap.com and open **Domain List**.
2. Tap **Manage** next to `hobbsmediaco.com`, then the **Advanced DNS** tab
   (on a phone the tabs may be in a dropdown at the top of the page).
3. In **Host Records**, delete the records Namecheap put there for you.
   There are usually two: an **A Record** for host `@` and a **CNAME Record**
   for host `www` that points at a parking page.
4. Click **Add New Record** twice and enter exactly these:

   | Type         | Host | Value                  | TTL       |
   |--------------|------|------------------------|-----------|
   | A Record     | @    | 216.198.79.1           | Automatic |
   | CNAME Record | www  | cname.vercel-dns.com   | Automatic |

5. Tap the green check to save each one.
6. Go back to the **Domain** tab. If there is a **Redirect Domain** or
   **Parking** section with anything in it, remove it.

That is all. It can take a few minutes to an hour to take effect. Until the
site goes live, `hobbsmediaco.com` shows a plain "not found" page; that is
expected and means the pointing worked.

## 2. Check the site is wired to its code (Vercel, about 1 minute)

1. Sign in at https://vercel.com and open the **hobbs-media-portfolio**
   project.
2. Open **Settings** (in the top bar, or behind the menu icon on a phone),
   then **Git** (in the left sidebar, or the section dropdown on a phone).
3. It should show **JWise16/hobbs-media-portfolio** as the connected
   repository. If it does, you are done.
4. If it says nothing is connected, click **Connect Git Repository**, choose
   GitHub, and pick `hobbs-media-portfolio`. If the repository is not in the
   list, click **Adjust GitHub App Permissions** and give Vercel access to
   it, then pick it.

While you are there: **Settings → Domains** should list `hobbsmediaco.com`
and `www.hobbsmediaco.com`. Once step 1 has taken effect, both show a green
check. Nothing to click; it is just confirmation.

## 3. Go live (only when Jonny says the site is ready)

Jonny will tell you when every fact on the site is confirmed and every clip
is approved. Then, and not before:

1. In the Vercel project, open **Settings → Environment Variables**.
2. Click **Add New**. Key: `SITE_STAGE`. Value: `live`. Under
   **Environments**, tick **Production** only.
3. Click **Save**.
4. Tell Jonny it is done. He pushes the release and the site appears at
   `hobbsmediaco.com` a couple of minutes later.

If step 2 is done before Jonny says go, the release simply refuses to build,
so there is no harm in a mistake; just tell him.

## Still needed from you for the words on the site

Jonny has your phone number. He still needs:

- Email address and Instagram handle to show
- Where you are based and the area you serve
- Turnaround time (how fast a client gets photos, and film)
- Whether "reply same day" is a promise you want to make
- The names you want for your three services
- A yes on each of the seven clips currently on the review link

Send those to Jonny in any form. Nothing goes live with a placeholder.
