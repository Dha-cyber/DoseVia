# DoseVia - Admin & Doctor logins

## Registering new accounts

On the sign-in screen pick **Doctor** or **Admin**, then tap **New? Register**. Patients register the same way.

## Admin

Choose **Admin** on the sign-in screen.

| Email             | Password   |
| ----------------- | ---------- |
| admin@DoseVia.com | Admin@1234 |

(Change in `src/lib/auth.ts` -> `ADMIN_EMAIL` / `ADMIN_PASSWORD`.)

## Doctors (20 seeded)

Choose **Doctor** on the sign-in screen and use the email + password below.
The admin can add more doctors (and remove any of these) from **Admin -> Doctors**.

| #   | Doctor                  | Speciality              | Email                           | Password     |
| --- | ----------------------- | ----------------------- | ------------------------------- | ------------ |
| 1   | Dr. Anil Verma          | Cardiologist            | anil.verma@DoseVia.com          | Anil@1234    |
| 2   | Dr. Priya Nair          | Endocrinologist         | priya.nair@DoseVia.com          | Priya@1234   |
| 3   | Dr. Rahul Menon         | Neurologist             | rahul.menon@DoseVia.com         | Rahul@1234   |
| 4   | Dr. Sunita Rao          | Nephrologist            | sunita.rao@DoseVia.com          | Sunita@1234  |
| 5   | Dr. Vikram Singh        | Gastroenterologist      | vikram.singh@DoseVia.com        | Vikram@1234  |
| 6   | Dr. Meera Iyer          | Pulmonologist           | meera.iyer@DoseVia.com          | Meera@1234   |
| 7   | Dr. Arjun Reddy         | General Physician       | arjun.reddy@DoseVia.com         | Arjun@1234   |
| 8   | Dr. Kavya Shetty        | Psychiatrist            | kavya.shetty@DoseVia.com        | Kavya@1234   |
| 9   | Dr. Suresh Patil        | Geriatrician            | suresh.patil@DoseVia.com        | Suresh@1234  |
| 10  | Dr. Anita Deshmukh      | Clinical Pharmacologist | anita.deshmukh@DoseVia.com      | Anita@1234   |
| 11  | Dr. Rohit Kulkarni      | Hepatologist            | rohit.kulkarni@DoseVia.com      | Rohit@1234   |
| 12  | Dr. Neha Gupta          | Rheumatologist          | neha.gupta@DoseVia.com          | Neha@1234    |
| 13  | Dr. Farhan Sheikh       | Dermatologist           | farhan.sheikh@DoseVia.com       | Farhan@1234  |
| 14  | Dr. Lakshmi Narayan     | Gynaecologist           | lakshmi.narayan@DoseVia.com     | Lakshmi@1234 |
| 15  | Dr. Manoj Joshi         | Orthopaedic Surgeon     | manoj.joshi@DoseVia.com         | Manoj@1234   |
| 16  | Dr. Divya Krishnan      | ENT Specialist          | divya.krishnan@DoseVia.com      | Divya@1234   |
| 17  | Dr. Sanjay Bhat         | Ophthalmologist         | sanjay.bhat@DoseVia.com         | Sanjay@1234  |
| 18  | Dr. Ritu Malhotra       | Oncologist              | ritu.malhotra@DoseVia.com       | Ritu@1234    |
| 19  | Dr. Karthik Subramanian | Urologist               | karthik.subramanian@DoseVia.com | Karthik@1234 |
| 20  | Dr. Pooja Agarwal       | Haematologist           | pooja.agarwal@DoseVia.com       | Pooja@1234   |

Starting passwords for the seeded doctors live in `src/lib/doctors.ts`. Doctors added by the admin use the password the admin typed.
