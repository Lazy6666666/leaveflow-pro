ALTER TABLE profiles DISABLE TRIGGER protect_profile_fields;

UPDATE profiles SET department_id = '31d9dd41-45ff-4b9c-9897-43ec23bb1c63', manager_id = NULL WHERE id = '4c8727a4-23c4-4282-96ac-0f1c87a026c0';
UPDATE profiles SET department_id = 'a72d13e3-1e9b-4a6e-bf34-98e98cee2db7', manager_id = '4c8727a4-23c4-4282-96ac-0f1c87a026c0' WHERE id = 'a3897d2d-7718-48e4-bcaa-ffcd4ff00d01';
UPDATE profiles SET department_id = '31d9dd41-45ff-4b9c-9897-43ec23bb1c63', manager_id = '4c8727a4-23c4-4282-96ac-0f1c87a026c0' WHERE id = '74075706-8f25-4a0c-905b-f90164e27201';
UPDATE profiles SET department_id = '17f28333-05fd-41d3-804d-f9292d7e6b77', manager_id = '4c8727a4-23c4-4282-96ac-0f1c87a026c0' WHERE id = 'd2978900-bfd0-460f-a9f8-0ccce37dde04';
UPDATE profiles SET department_id = 'ef0c91ec-e163-4724-b9fc-8d990bc16a0b', manager_id = '4c8727a4-23c4-4282-96ac-0f1c87a026c0' WHERE id = '9c7d43bb-d605-4af9-b074-8321cf3a68a0';

ALTER TABLE profiles ENABLE TRIGGER protect_profile_fields;