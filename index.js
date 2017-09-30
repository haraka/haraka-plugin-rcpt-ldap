'use strict';

exports.register = function () {
    const plugin = this;
    plugin.load_rcpt_to.ldap_ini();
}

exports.load_rcpt_to.ldap_ini = function () {
    const plugin = this;

    plugin.cfg = plugin.config.get('rcpt_to.ldap.ini', {
        booleans: [
            '+enabled',               // plugins.cfg.main.enabled=true
            '-disabled',              // plugins.cfg.main.disabled=false
            '+feature_section.yes'    // plugins.cfg.feature_section.yes=true
        ]
    },
    function () {
        plugin.load_example_ini();
    });
}
