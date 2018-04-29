# MAIA | Masked Authenticated IOTA Address

## Protocol

** General description **

A public MAM channel in which each message is an IOTA address and which always returns the last message.

Characteristics:
- Public MAM channel
- Security level 2
- Channel root = MAIA address

&nbsp;

** Current version **

- Number: 2
- Date: WIP

&nbsp;

** Specification **

*generate*
- Creates a new MAIA for a given address
- generate(address, seed = [autogenerated]):maia

*obtain*
- Returns the address assoaciated with a MAIA
- obtain(maia):address

*update*
- Updates the MAIA with a new address
- update(address, seed)