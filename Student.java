import java.util.Scanner;

class Result {
    private String student_name, course;
    private int student_id, mark1, mark2, mark3;
    private Scanner sc = new Scanner(System.in);

    public void setDetails() {
       
        System.out.print("Enter student id: ");
        student_id = sc.nextInt();
        while (student_id <= 0) {
            System.out.println("Invalid ID.");
            System.out.print("Enter a correct positive id: ");
            student_id = sc.nextInt();
        }
       
        sc.nextLine();
       
        System.out.print("Enter your name: ");
        student_name = sc.nextLine();

        System.out.print("Enter your course: ");
        course = sc.nextLine();
       
       
        System.out.print("Enter mark 1 : ");
        mark1 = sc.nextInt();
        while (mark1 < 0 || mark1 > 100) {
            System.out.println("Invalid mark! Mark must be between 0 and 100.");
            System.out.print("Enter mark 1 again: ");
            mark1 = sc.nextInt();
        }

       
        System.out.print("Enter mark 2 : ");
        mark2 = sc.nextInt();
        while (mark2 < 0 || mark2 > 100) {
            System.out.println("Invalid mark! Mark must be between 0 and 100.");
            System.out.print("Enter mark 2 again: ");
            mark2 = sc.nextInt();
        }

       
        System.out.print("Enter mark 3 : ");
        mark3 = sc.nextInt();
        while (mark3 < 0 || mark3 > 100) {
            System.out.println("Invalid mark! Mark must be between 0 and 100.");
            System.out.print("Enter mark 3 again: ");
            mark3 = sc.nextInt();
        }
    }

    public void displayReport() {
        int total = mark1 + mark2 + mark3;
        double avg = total / 3.0;
       
        String result = (avg >= 40.0) ? "Pass" : "Fail";

        System.out.println("--- Student Results ---");
        System.out.println("Student ID: " + student_id);
        System.out.println("Student Name: " + student_name);
        System.out.println("Course: " + course);

        System.out.println("-- Marks ---");
        System.out.println("Subject 1: " + mark1);
        System.out.println("Subject 2: " + mark2);
        System.out.println("Subject 3: " + mark3);

        System.out.println("Total: " + total);
        System.out.printf("Average: %.2f\n", avg);
        System.out.println("Result: " + result);
    }
}

public class Student {
    public static void main(String[] args) {
        Result r = new Result();
        r.setDetails();
        r.displayReport();
    }
}