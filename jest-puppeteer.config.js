module.exports = {
  launch: {
    headless: false,
    // executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      `--disable-extensions-except=./src/`,
      // This below line liiks like redundant
      // `--load-extension=./src/`
    ]
  },
  exitOnPageError: false
}
