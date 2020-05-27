# Three.js SVG Cube morphing

A small experimentation using THREE.JS SVGRenderer to render a SVG Cube including morphing and other animations.
This is also using the THREE.JS CSSRenderer to display HTML text in a 3D environment.

## Setup

* `gem install bundler`
* `bundle install && yarn install`

## Development

* `yarn start` - local dev server at localhost:4000
* `yarn run build` - build for production

## Structure

* `dist/` - output folder
* `src/` - source folder (default Jekyll files moved here)

    * `src/_includes/` - components
    * `src/_pages/` - pages (except index)
    * `src/_webpack/` - JS and SCSS entry files (to be compiled with webpack, then fed into Jekyll-visible asset folder)
    * `src/assets/` - Jekyll-visible assets (JS, CSS, images) that will moved into `dist/` by Jekyll

## Troubleshooting
If you're having any issue when starting the server, be sure your Ruby and Jekyll version are recent enough
\>= 4.0.0 for Jekyll
\> 2.3.0 for Ruby

You can download the last version of ruby [here](https://www.ruby-lang.org/en/downloads/)

And update jekyll with this command line:
`bundle update jekyll`
