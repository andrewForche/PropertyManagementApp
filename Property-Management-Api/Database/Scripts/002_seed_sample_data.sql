USE property_management_app;

INSERT INTO Properties (PropertyName, AddressLine1, UnitNumber, MonthlyRent, OccupancyStatus) VALUES
('Sunrise Apts', '123 Maple St', '1A', 1200.00, 'occupied'),
('Sunrise Apts', '123 Maple St', '1B', 1250.00, 'occupied'),
('Oak Estates', '456 Oak Ave', 'Unit 10', 2000.00, 'occupied'),
('Oak Estates', '456 Oak Ave', 'Unit 11', 2100.00, 'occupied'),
('River View', '789 River Rd', '302', 1500.00, 'occupied'),
('River View', '789 River Rd', '303', 1550.00, 'occupied'),
('The Lofts', '101 Urban Sq', 'A', 3000.00, 'occupied'),
('The Lofts', '101 Urban Sq', 'B', 3200.00, 'occupied'),
('Pine Ridge', '555 Pine Ln', '5', 900.00, 'occupied'),
('Pine Ridge', '555 Pine Ln', '6', 950.00, 'occupied');

INSERT INTO Tenants (FirstName, LastName, Email, PhoneNumber, PropertyId, TenantStatus) VALUES
('John', 'Doe', 'john@example.com', '555-0101', 1, 'active'),
('Jane', 'Smith', 'jane@example.com', '555-0102', 2, 'past_due'),
('Mike', 'Jones', 'mike@example.com', '555-0103', 3, 'past_due'),
('Sarah', 'Wilson', 'sarah@example.com', '555-0104', 4, 'active'),
('Alex', 'Brown', 'alex@example.com', '555-0105', 5, 'active'),
('Chris', 'Davis', 'chris@example.com', '555-0106', 6, 'past_due'),
('Pat', 'Taylor', 'pat@example.com', '555-0107', 7, 'active'),
('Sam', 'Moore', 'sam@example.com', '555-0108', 8, 'past_due'),
('Kelly', 'White', 'kelly@example.com', '555-0109', 9, 'active'),
('Drew', 'Harris', 'drew@example.com', '555-0110', 10, 'past_due');

INSERT INTO RentSchedules (TenantId, DueDate, ScheduleStatus, BaseRent, LateFeeAmount, BalanceDue, ReminderCount) VALUES
(1, '2026-02-01', 'Paid', 1200.00, 0.00, 0.00, 0),
(2, '2026-02-01', 'Unpaid', 1250.00, 0.00, 1250.00, 1),
(3, '2026-02-01', 'Late', 2000.00, 0.00, 2000.00, 3),
(4, '2026-02-01', 'Unpaid', 2100.00, 0.00, 2100.00, 0),
(5, '2026-02-01', 'Paid', 1500.00, 0.00, 0.00, 0),
(6, '2026-02-01', 'Partial', 1550.00, 0.00, 1050.00, 2),
(7, '2026-02-01', 'Paid', 3000.00, 0.00, 0.00, 0),
(8, '2026-02-01', 'Unpaid', 3200.00, 0.00, 3200.00, 0),
(9, '2026-02-01', 'Paid', 900.00, 0.00, 0.00, 0),
(10, '2026-02-01', 'Unpaid', 950.00, 0.00, 950.00, 1);

INSERT INTO RentPayments (ScheduleId, AmountPaid, PaymentMethod, PaymentDate, ReferenceNumber) VALUES
(1, 1200.00, 'ACH', '2026-02-01 08:30:00', 'ACH-1001'),
(5, 1500.00, 'Card', '2026-02-02 10:15:00', 'CARD-1005'),
(7, 3000.00, 'ACH', '2026-02-01 07:45:00', 'ACH-1007'),
(9, 900.00, 'ACH', '2026-02-03 09:20:00', 'ACH-1009'),
(6, 500.00, 'Card', '2026-02-04 14:05:00', 'CARD-1006');

INSERT INTO MaintenanceProjects (PropertyId, ProjectTitle, ProjectDescription, BidAmount, ProjectStatus, AssignedVendor) VALUES
(1, 'Broken Faucet', 'Kitchen sink faucet replacement', 150.00, 'Closed', 'Fix-It Plumbing'),
(2, 'Paint Bedroom', 'Repaint bedroom walls and trim', 400.00, 'Invoiced', 'Pro Painters'),
(3, 'AC Repair', 'Repair non-functioning air conditioning unit', 800.00, 'Work Order', 'CoolAir Inc'),
(4, 'Roof Leak', 'Investigate and repair roof leak', 2500.00, 'Bid', 'TopRoofing'),
(5, 'Floor Buffing', 'Buff and refinish wood flooring', 300.00, 'Approved', 'Janitor Pro'),
(6, 'Door Lock Fix', 'Replace damaged front door lock', 100.00, 'Closed', 'SafeLocks'),
(7, 'Window Cleaning', 'Exterior and interior window cleaning', 200.00, 'Invoiced', 'ClearView'),
(8, 'Electrical Spark', 'Inspect and fix electrical sparking outlet', 600.00, 'Work Order', 'VoltGuys'),
(9, 'Gutter Clean', 'Remove debris and flush gutters', 150.00, 'Approved', 'YardHelp'),
(10, 'New Carpet', 'Replace worn carpet in living room', 1200.00, 'Bid', 'CarpetWorld');

INSERT INTO WorkLogs (ProjectId, ClockInTime, ClockOutTime, GPSLocation, ProofPhotoUrl, WorkNotes) VALUES
(1, '2026-01-10 09:00:00', '2026-01-10 10:30:00', '34.05,-118.24', 'img01.jpg', 'Completed faucet replacement and leak test.'),
(6, '2026-01-12 14:00:00', '2026-01-12 14:45:00', '34.06,-118.25', 'img02.jpg', 'Installed new lock and verified operation.');

INSERT INTO Invoices (ProjectId, TotalAmount, InvoiceStatus, IssuedOn, PaidOn, IsExported) VALUES
(1, 150.00, 'Paid', '2026-01-10', '2026-01-12', TRUE),
(2, 400.00, 'Sent', '2026-01-15', NULL, FALSE),
(6, 100.00, 'Paid', '2026-01-12', '2026-01-12', TRUE),
(7, 200.00, 'Sent', '2026-01-16', NULL, FALSE);
