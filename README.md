# CHARI STUDIO

Source for [chari.studio](https://chari.studio), rebuilt from the original Cargo site as plain HTML, CSS and JavaScript and hosted on GitHub Pages.

## Structure

- index.html is the home page (soundworks and artwork list over the pixelated portrait).
- Each project lives in its own folder (mutate/, harriet-1/, ...), so the old Cargo addresses like chari.studio/mutate keep working.
- assets/style.css and assets/site.js hold the shared design and behaviour (audio players, slideshows, image zoom, home backdrop).
- media/ holds images, audio and video.

## Media

All media was originally hosted on Cargo. media/manifest.tsv lists every file and where it came from. The **Fetch media from Cargo** workflow (Actions tab) downloads each file, converts WAV to MP3, MOV to MP4 and resizes large photos, then commits them into media/. It runs automatically when the manifest changes and can be run by hand with "Run workflow".

To add a new image later, just drop it into media/ and reference it from the page.

## Editing

Open the page's index.html on github.com, click the pencil icon, edit the text, and commit. GitHub Pages republishes within a minute or two.

## Custom domain

Once you are happy with the site at the GitHub Pages address, add chari.studio under Settings → Pages → Custom domain, then point the domain's DNS at GitHub Pages (four A records for the apex domain and a CNAME for www).
