# Known Architectural Failures / Fixes

- **`sys.path` Hack**: Initial bootstrap attempts directly manipulated `sys.path`. We reverted this immediately for a more robust `run.py` strategy in root.
- **Scattered Display Styles**: Widgets originally initialized with embedded `.setStyleSheet()`. This was halted completely.
- **Pre-M3 Row Dict Keys Error**: `sqlite3.Row` natively crashes if called with `.get()` method. I replaced `row.get()` calls with explicitly safe index tests. Hardcoded `'Live'` query strings were ripped out entirely.
- **ListingService SQL Boundary Leak**: The ListingService originally leaked raw `sqlite` session connection dependencies and hardcoded SQL commands. This architecture failure was patched natively by shuffling queries down into the `ListingRepository`.
- **Global Context Orphan ID Leaks**: `Listings Master` views leaked arbitrary `store_id` numbers into UI columns previously. Repositories were upgraded to execute `.get_all()` methods containing native `JOIN` filters extracting proper human-readable reference data.
- **Initial File Upload Constraints**: Historically, media loading was disconnected. This has natively been resolved in Milestone 9 utilizing strictly-enforced `QFileDialog` routing writing *strings* safely indicating absolute pathways internally.
