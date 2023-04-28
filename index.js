'use strict';

const util = require('util');

exports.register = function () {
    this.inherits('rcpt_to.host_list_base');

    try {
        this.ldap = require('ldapjs');
    }
    catch (e) {
        this.logerror("failed to load ldapjs, " +
            " try installing it: npm install ldapjs");
        return;
    }

    // only load this stuff if ldapjs loaded
    this.load_host_list();
    this.load_ldap_ini();
    this.register_hook('rcpt', 'ldap_rcpt');
}

exports.load_ldap_ini = function () {
    this.cfg = this.config.get('rcpt_to.ldap.ini', 'ini', () => {
        this.load_ldap_ini();
    });
}

exports.ldap_rcpt = function (next, connection, params) {
    const txn = connection.transaction;
    if (!txn) return next();

    const rcpt = txn.rcpt_to[txn.rcpt_to.length - 1];
    if (!rcpt.host) {
        txn.results.add(this, {fail: '!domain'});
        return next();
    }
    const domain = rcpt.host.toLowerCase();

    if (!this.in_host_list(domain) && !this.in_ldap_ini(domain)) {
        connection.logdebug(this, `domain '${  domain  }' is not local; skip ldap`);
        return next();
    }

    const ar = txn.results.get('access');
    if (ar && ar.pass.length > 0 && ar.pass.includes("rcpt_to.access.whitelist")) {
        connection.loginfo(this, "skip whitelisted recipient");
        return next();
    }

    txn.results.add(this, { msg: 'connecting' });

    const cfg = this.cfg[domain] || this.cfg.main;
    if (!cfg) {
        connection.logerror(this, `no LDAP config for ${  domain}`);
        return next();
    }

    let client;
    try { client = this.ldap.createClient({ url: cfg.server }); }
    catch (e) {
        connection.logerror(this, `connect error: ${  e}`);
        return next();
    }

    client.on('error', (err) => {
        connection.loginfo(this, `client error ${  err.message}`);
        next(DENYSOFT, 'Backend failure. Please, retry later');
    });

    client.bind(cfg.binddn, cfg.bindpw, (err) => {
        connection.logerror(this, `error: ${  err}`);
    });

    const opts = this.get_search_opts(cfg, rcpt);
    connection.logdebug(this, `Search filter is: ${  util.inspect(opts)}`);

    const search_result = (err, res) => {
        if (err) {
            connection.logerror(this, `LDAP search error: ${  err}`);
            return next(DENYSOFT, 'Backend failure. Please, retry later');
        }
        const items = [];
        res.on('searchEntry', (entry) => {
            connection.logdebug(this, `entry: ${  JSON.stringify(entry.object)}`);
            items.push(entry.object);
        });

        res.on('error', (err2) => { // called for tcp (non-ldap) errors
            connection.logerror(this, `LDAP search error: ${  err2}`);
            next(DENYSOFT, 'Backend failure. Please, retry later');
        });

        res.on('end', (result) => {
            connection.logdebug(this, `LDAP search results: ${  items.length  } -- ${  util.inspect(items)}`);

            if (items.length) return next();

            next(DENY, "Sorry - no mailbox here by that name.");
        });
    };
    client.search(cfg.basedn, opts, search_result);
};

exports.get_search_opts = (cfg, rcpt) => {

    const plain_rcpt = rcpt.address().toLowerCase();
    // JSON.stringify(rcpt.original).replace(/</, '').replace(/>/, '').replace(/"/g, '');

    return {
        filter: `(&(objectClass=${  cfg.objectclass  })(|(mail=${  plain_rcpt   })(mailAlternateAddress=${  plain_rcpt  })))`,
        scope: 'sub',
        attributes: ['dn', 'mail', 'mailAlternateAddress']
    };
};

exports.in_ldap_ini = function (domain) {
    if (!domain) return false;
    if (!this.cfg) return false;
    if (!this.cfg[domain]) return false;
    if (!this.cfg[domain].server) return false;
    return true;
};
