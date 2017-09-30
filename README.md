[![Build Status][ci-img]][ci-url]
[![Code Climate][clim-img]][clim-url]
[![Greenkeeper badge][gk-img]][gk-url]
[![NPM][npm-img]][npm-url]
[![Windows Build Status][ci-win-img]][ci-win-url]

# haraka-plugin-rcpt-ldap

This plugin tries to validate recipients against an LDAP server. This will help
in replacing an existing qmail-ldap installation with Haraka.

The plugin assumes simple qmail-ldap style LDAP records. It is completely
configurable using the `config/rcpt_to.ldap.ini` file.

The logic that is followed is:

  * Check if the recipient is for a local domain (ie. check if the domaiin is
    present in `host_list`)

  * Check if the recipient is already whitelisted

  * Run an LDAP search to see if the recipient can be found in LDAP.



<!-- leave these buried at the bottom of the document -->
[ci-img]: https://travis-ci.org/haraka/haraka-plugin-rcpt-ldap.svg
[ci-url]: https://travis-ci.org/haraka/haraka-plugin-rcpt-ldap
[ci-win-img]: https://ci.appveyor.com/api/projects/status/CHANGETHIS?svg=true
[ci-win-url]: https://ci.appveyor.com/project/haraka/haraka-CHANGETHIS
[cov-img]: https://codecov.io/github/haraka/haraka-plugin-rcpt-ldap/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-plugin-rcpt-ldap
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-rcpt-ldap/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-rcpt-ldap
[gk-img]: https://badges.greenkeeper.io/haraka/haraka-plugin-rcpt-ldap.svg
[gk-url]: https://greenkeeper.io/
[npm-img]: https://nodei.co/npm/haraka-plugin-rcpt-ldap.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-rcpt-ldap
