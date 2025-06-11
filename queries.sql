SELECT * FROM Customers JOIN Companies
 ON Customers.company_id = Companies.company_id;

 INSERT INTO Customers (first_name, last_name, rating, company_id)
  VALUES ("Tony", "Stare", 3, 1);

  SELECT first_name, last_name, name AS "department_name" FROM Employees JOIN Departments
   ON Employees.department_id = Departments.department_id;

INSERT INTO Employees (first_name, last_name, department_id) 
 VALUES ('Andy', 'Lau', 2);

 DELETE FROM Customers WHERE customer_id = 5;

 UPDATE Customers SET first_name="Andy2", last_name="Lau2", rating="1", company_id="1"
  WHERE customer_id = 7;

SELECT * FROM Customers JOIN EmployeeCustomer ON Customers.customer_id = EmployeeCustomer.customer_id WHERE Customers.customer_id = 10;