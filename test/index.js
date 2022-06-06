'use strict';

const assert = require('assert')

const Address      = require('address-rfc2821').Address;
const fixtures     = require('haraka-test-fixtures');

const _set_up = function (done) {

    this.plugin = new fixtures.plugin('rcpt-ldap');

    // this no longer works as a standalone test
    // this.plugin.inherits('rcpt_to.host_list_base');

    this.plugin.in_host_list = function (domain) {
        const plugin = this;
        plugin.logdebug(`checking ${  domain  } in config/host_list`);
        if (plugin.host_list[domain]) {
            return true;
        }
        return false;
    }

    this.plugin.cfg = {};
    this.plugin.host_list = {};
    this.connection = fixtures.connection.createConnection();
    this.connection.transaction = {
        results: new fixtures.results(this.connection),
        notes: {},
        rcpt_to: [new Address('test@test.com')]
    }

    done();
}

describe('in_host_list', function () {
    beforeEach(_set_up)

    it('miss', function (done) {
        assert.equal(false, this.plugin.in_host_list('test.com'));
        done()
    })
    it('hit', function (done) {
        this.plugin.host_list['test.com'] = true;
        assert.equal(true, this.plugin.in_host_list('test.com'));
        done()
    })
})

describe('in_ldap_ini', function () {
    beforeEach(_set_up)

    it('miss', function (done) {
        assert.equal(false, this.plugin.in_ldap_ini('test.com'));
        done()
    })
    it('hit', function (done) {
        this.plugin.cfg['test.com'] = { server: 'foo.test.com' };
        assert.equal(true, this.plugin.in_ldap_ini('test.com'));
        done()
    })
})

describe('ldap_rcpt', function () {
    beforeEach(_set_up)

    it('missing txn', function (done) {
        // sometimes txn goes away, make sure it's handled
        const next = function (rc, msg) {
            assert.equal(undefined, rc);
            assert.equal(undefined, msg);
        };
        delete this.connection.transaction;
        this.plugin.ldap_rcpt(next, this.connection, [new Address('test@test.com')]);
        assert.ok(true);
        done()
    })

    it('not in host_list or rcpt_to.ldap.ini', function (done) {
        const next = function (rc, msg) {
            assert.equal(undefined, rc);
            assert.equal(undefined, msg);
            done()
        };
        this.plugin.ldap_rcpt(next, this.connection, [new Address('test@test.com')]);
    })

    it('in host_list', function (done) {
        const next = function (rc, msg) {
            assert.equal('connecting', this.connection.transaction.results.get('rcpt-ldap').msg[0]);
            done()
        }.bind(this);
        this.plugin.host_list = { 'test.com': true };
        this.plugin.ldap_rcpt(next, this.connection, [new Address('test@test.com')]);
    })

    it('in rcpt_to.ldap.ini', function (done) {
        const next = function (rc, msg) {
            assert.equal('connecting', this.connection.transaction.results.get('rcpt-ldap').msg[0]);
            done()
        }.bind(this);
        this.plugin.cfg['test.com'] = { server: 'ldap.test.com' };
        this.plugin.ldap_rcpt(next, this.connection, [new Address('test@test.com')]);
    })
    // TODO: detect a working LDAP server and test against it
})
