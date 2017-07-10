# ZScript

Scripting language for Meta Zen, Zen Spaces.

## Stable

I'm currently developing in the "master" branch.  This commit is stable.

## Building the Code

To build the code, use the following steps.

Ensure that [NodeJS](http://nodejs.org/) (6.0 or greater) is installed.

Install libedit-dev (for command-line repl)
```shell
sudo apt install libedit-dev
```

Install the project dependencies using NPM:
```shell
npm install
```

Install [Gulp](http://gulpjs.com/) if it's not already installed.
```shell
sudo npm install -g gulp
```

Generate the code
```shell
gulp build
```

Run ZScript
```shell
node dist/zscript/main.js {your zs file}
```

## Examples

The language is changing rapidly and many of the examples are not functional, but the specs, unit tests, etc are a good place to start.
