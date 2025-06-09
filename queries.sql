SELECT * FROM Customers JOIN Companies
 ON Customers.company_id = Companies.company_id;

 INSERT INTO Customers (first_name, last_name, rating, company_id)
  VALUES ("Tony", "Stare", 3, 1);

  SELECT first_name, last_name, name AS "department_name" FROM Employees JOIN Departments
   ON Employees.department_id = Departments.department_id;

INSERT INTO Employees (first_name, last_name, department_id) 
 VALUES ('Andy', 'Lau', 2);