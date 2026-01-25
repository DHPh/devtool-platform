# DNS Resolver Configuration and Privacy

The server-side DNS Lookup tool uses one isolated Node.js `Resolver` instance. It does not mutate the process-wide DNS server list for each query.

## Default behavior

By default, the resolver uses the DNS servers configured for the deployment host. Those servers may be supplied by the operating system, hosting provider, corporate network, or internet service provider. DNS queries therefore leave the application server and disclose the queried domain name and requested record type to that resolver. Traditional DNS transport may be unencrypted depending on the host configuration.

The application does not write queried domains, returned records, URLs, or request payloads to its security logs. DNS results are returned to the requesting browser and are not cached by the application.

## Custom resolvers

Operators can set a comma-separated server list once at process startup:

```env
DNS_RESOLVERS=1.1.1.1,1.0.0.1
```

This opts the deployment into those resolver operators' privacy and retention policies. Addresses may include supported IPv4, IPv6, and explicit-port forms accepted by Node.js. Invalid configuration fails during application initialization instead of silently falling back.

The route limits each lookup to five seconds and two resolver attempts. Supported record types are `A`, `AAAA`, `MX`, `TXT`, `NS`, `SOA`, `CNAME`, and `PTR`.
