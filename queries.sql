SELECT * FROM Customers JOIN Companies
 ON Customers.company_id = Companies.company_id;

 INSERT INTO Customers (first_name, last_name, rating, company_id)
  VALUES ("Tony", "Stare", 3, 1);