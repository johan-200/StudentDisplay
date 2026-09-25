import java.util.Scanner;
class Student{
	String name;
	int reg;
	double marks;
	void Display(){
		System.out.println(name);
		System.out.println(reg);
		System.out.println(marks);	
	}
};
class Display{
	public static void main(String args[]){
        Scanner sc=new Scanner(System.in);
		Student s=new Student();
        System.out.println("Enter name:");
		s.name= sc.nextLine();
        System.out.println("Enter reg.no:");
		s.reg=sc.nextInt();
        System.out.println("Enter mark:");
		s.marks=sc.nextDouble();
		s.Display();
	}
};