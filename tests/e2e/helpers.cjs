function isAuthRedirect(page) {
  return page.url().includes("/auth");
}

module.exports = {
  isAuthRedirect,
};
