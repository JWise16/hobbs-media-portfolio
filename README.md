# Hobbs Media Co. website

This is the code behind **https://hobbsmediaco.com**, Sam's real estate
photo, film and aerial site. This page is written for Sam. If you are a
developer, jump to [For developers](#for-developers).

## The short version

- The site is a set of files in this folder (a "repository"). Change the
  files, and the site changes.
- You don't edit files by hand. You tell **Claude Code** what you want in
  plain English, it makes the change, and it shows you a preview link before
  anything goes public.
- Nothing you ask for can break the live site by accident. Every change is
  checked automatically, shown to you on a preview, and only goes public when
  you say so.

## Who owns what

| Thing | Where it lives | Owner |
|---|---|---|
| The web address `hobbsmediaco.com` | Namecheap | Sam |
| The hosting (turns the code into the live site) | Vercel, project `hobbs-media-portfolio` | Sam |
| The code | GitHub, `JWise16/hobbs-media-portfolio` | Jonny, with Sam as a collaborator |
| The raw footage | Sam's phone, drone and Drive | Sam (it is never stored in the code) |

## What you can change yourself

Three kinds of changes cover almost everything, and Claude Code handles all
of them:

1. **Words.** Any text on the site: the headline, the about paragraphs, the
   contact line, a clip's title. Say what it says now and what it should say.
2. **Order and set of clips.** Move a clip up or down, remove one, swap which
   clip is the big one at the top (the "hero").
3. **New clips.** Upload the video to Google Drive, share it, and give Claude
   the link. See [Adding a new video](#adding-a-new-video).

Things that are better to send to Jonny: changing colors, fonts or layout;
anything about how videos play; adding an Instagram line or a stats row for
the first time; the "calling card" pages for agents.

## How to make a change, step by step

1. Open Claude Code and pick this repository (`JWise16/hobbs-media-portfolio`).
2. Say what you want. Examples that work well:
   - "Change the about headline to: Based in Seattle. Part 107. 48 hour turnaround."
   - "Move Working Water to the top of the recent shoots list."
   - "Remove The Acropolis from the site."
   - "Make Golden Hour on the Spit the hero clip."
   - "Add this video after Under Sail: [Drive link]. Call it Evening Sail,
     subtitle Aerial film · Lake Union. Use roughly seconds 12 to 22."
3. Claude makes the change and opens a **pull request**. Think of it as a
   draft of the site with your change in it. A bot comments on the pull
   request with a **preview link** a couple of minutes later.
4. Open the preview link on your phone. It looks and works exactly like the
   real site, just at a temporary address nobody else knows.
5. Happy? Tell Claude "looks good, merge it". Not happy? Tell Claude what to
   fix and check the new preview.
6. Merging updates the draft site. To make it public, tell Claude
   **"publish it"**. It pushes the change to the live site, which takes about
   two minutes.

If anything you ask for would break a rule the site enforces (a line too long
for the header, a clip that doesn't exist), Claude tells you what to change
instead. The site refuses to build until it's right, so a mistake stays on
the preview, never on hobbsmediaco.com.

## Adding a new video

1. Upload the original file to Google Drive. Best quality is the file
   straight from the drone or camera, not a copy that went through Photos or
   iMessage. Big is fine.
2. Right-click the file, **Share**, set it to **Anyone with the link**, copy
   the link.
3. Watch the video once and note:
   - roughly which seconds you want (for example "from 12 to 22"; 6 to 12
     seconds of footage is the sweet spot);
   - a title and a subtitle for the caption (titles up to about 28 characters);
   - where it goes in the list.
4. Give Claude the link and those notes. Claude downloads the file, cuts it,
   encodes it for phones and desktops, makes the still image the site shows
   before the video plays, and opens a pull request with a preview link.
5. On the preview, check that the crop looks right on your phone and that the
   loop point isn't jarring. If the loop looks odd, say so: there are two
   loop styles (a soft dissolve, and a back-and-forth "boomerang") and Claude
   can switch, or shift the start and end seconds.

Every clip you add is treated as approved by you. The site never shows
footage that wasn't added on purpose.

## Words you'll see

- **Repository (repo):** the folder of files that is the site.
- **Pull request (PR):** a proposed change, with its own preview link.
- **Merge:** accept the proposed change into the main copy.
- **Preview:** a temporary copy of the site with your change, on a private
  link. Vercel makes one for every pull request.
- **Publish / go live:** copy the main version onto hobbsmediaco.com. This is
  a separate, deliberate step.
- **Build:** Vercel turning the files into the site. A build can "fail", which
  just means something was wrong and nothing changed.

## If something looks wrong on the live site

Tell Claude "the live site shows X, it should show Y" and it will find the
last change and fix or undo it. The site keeps every previous version, so
going back is always possible. If you can't reach Claude, text Jonny.

---

## For developers

The technical reference, including the footage pipeline, the build guard,
scripts, layout and tests, is in [`docs/developing.md`](docs/developing.md).
Working rules for coding agents are in [`CLAUDE.md`](CLAUDE.md). The design
source of truth is
[`docs/designs/hobbs-media-portfolio.md`](docs/designs/hobbs-media-portfolio.md)
with the token sheet in [`DESIGN.md`](DESIGN.md).
