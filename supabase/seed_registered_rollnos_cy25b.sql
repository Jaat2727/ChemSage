-- Seed data derived from the supplied CY25B student list screenshot.
-- All of these are BS 2025 entries.

insert into public.registered_rollnos (roll_no, name, programme, batch_year)
values
  ('CY25B001', 'Advaith Sreeranth', 'BS', 2025),
  ('CY25B002', 'Anukriti Mavuri', 'BS', 2025),
  ('CY25B003', 'Ashutosh Kumar Jha', 'BS', 2025),
  ('CY25B005', 'N Elaya Bharati', 'BS', 2025),
  ('CY25B006', 'Hanneshreya', 'BS', 2025),
  ('CY25B007', 'Kota Akhil Tej', 'BS', 2025),
  ('CY25B009', 'Rajdeep Kumar', 'BS', 2025),
  ('CY25B012', 'Madhuri Meena', 'BS', 2025),
  ('CY25B013', 'Nishu Dahiya', 'BS', 2025),
  ('CY25B014', 'Philip Bosco', 'BS', 2025),
  ('CY25B015', 'Riddhi Gujar', 'BS', 2025),
  ('CY25B017', 'Aryan', 'BS', 2025),
  ('CY25B020', 'Mohamed Shameem', 'BS', 2025),
  ('CY25B021', 'Piyush Kumar', 'BS', 2025),
  ('CY25B024', 'Vikesh Vighnamurti', 'BS', 2025),
  ('CY25B025', 'Aditya Ravi Wathrey', 'BS', 2025),
  ('CY25B026', 'Kanishk Kanojia', 'BS', 2025),
  ('CY25B027', 'Mayank Rana', 'BS', 2025),
  ('CY25B028', 'Paridhi Vyas', 'BS', 2025),
  ('CY25B029', 'Saprishi Deb', 'BS', 2025),
  ('CY25B030', 'Steve Samuel Barreto', 'BS', 2025),
  ('CY25B031', 'Sushil Kumar', 'BS', 2025),
  ('CY25B032', 'R Vasudevan', 'BS', 2025),
  ('CY25B033', 'Ankit Rajendran', 'BS', 2025),
  ('CY25B034', 'Aakansha Shukla', 'BS', 2025)
on conflict (roll_no) do update
set
  name = excluded.name,
  programme = excluded.programme,
  batch_year = excluded.batch_year;
