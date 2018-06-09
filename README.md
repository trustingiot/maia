# MAIA | Masked Authenticated IOTA Address

## Protocol

### General description

A public MAM channel in which each message is an IOTA address and which always returns the last message.

Characteristics:
- Public MAM channel
- Security level 2
- Channel root = MAIA address

&nbsp;

### Current version

- Number: 2
- Date: 29.04.2018

&nbsp;

### Specification

*get*
- Returns the address associated with a MAIA
- get(maia):address

*post*
- Creates or updates the address associated with a MAIA
- post(address, seed = [autogenerated]):message