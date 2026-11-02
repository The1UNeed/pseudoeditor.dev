import { lesson, section, type Lesson } from "./types";

export const apCsa: Lesson[] = [
  lesson("objects-and-methods", ["Use Java values, objects, and methods", "使用 Java 的值、对象和方法"],
    ["Read types, expressions, method calls, and String operations in Java.", "阅读 Java 的类型、表达式、方法调用和字符串操作。"], ["Using objects and methods", "使用对象与方法"], [
      section(["Follow the type of each expression", "追踪表达式的类型"], [
        ["Java distinguishes primitive values such as int, double, and boolean from object references such as String. Integer division discards the fractional part: 7 / 2 is 3. Converting an operand to double before dividing gives 3.5; converting the already-computed integer result does not restore the fraction.", "Java 区分 int、double、boolean 等基本类型值与 String 等对象引用。整数除法丢弃小数部分，7 / 2 得到 3。除法前把一个操作数转换为 double 才得到 3.5，事后转换整数结果不能找回小数。"],
        ["A method call has a name, arguments, and possibly a return value. String positions start at 0. substring(0, 3) includes position 0 and excludes position 3. Strings are immutable, so taking a substring does not change the original object.", "方法调用包含名称、实参和可能的返回值。String 的位置从 0 开始；substring(0, 3) 包含位置 0，但不包含位置 3。字符串不可变，截取子串不会修改原字符串。"],
      ], `public class Demo {
    public static void main(String[] args) {
        int total = 7;
        double mean = (double) total / 2;
        String name = "Computer";
        System.out.println(mean);
        System.out.println(name.substring(0, 3));
    }
}`, "java"),
      section(["Compare content deliberately", "明确比较的是内容还是引用"], [
        ["For primitive numeric values, == compares values. For object references, == asks whether the references identify the same object. Use a String's equals method when the question is whether its character content matches another string.", "对基本数值，== 比较值；对对象引用，== 检查是否指向同一个对象。要判断字符串字符内容是否相同，应使用 String 的 equals 方法。"],
        ["Read an API method's signature and preconditions before using it. For substring, check the bounds against length(). A program that compiles may still fail at runtime when an index is outside the allowed range.", "使用 API 前应阅读方法签名与前置条件。例如 substring 的边界应根据 length() 检查。程序即使能编译，索引越界时仍可能在运行时失败。"],
      ]),
    ], ["What two lines does the example print?", "示例输出哪两行？"], ["3.5 and Com. The cast happens before division, and substring excludes its end index.", "输出 3.5 和 Com。类型转换发生在除法之前，而 substring 不包含结束索引。"]),
  lesson("selection-and-iteration", ["Write Java conditions and loops", "编写 Java 条件与循环"],
    ["Trace short-circuit conditions, loop bounds, and repeated calculations.", "追踪短路条件、循环边界和重复计算。"], ["Selection and iteration", "选择与迭代"], [
      section(["Separate the condition from the update", "分清条件判断与更新"], [
        ["A for loop initializes a counter, checks its condition before each iteration, and applies its update after the body. With i < 4, the values 0, 1, 2, and 3 enter the body. Changing < to <= adds an iteration and may cause an array index error.", "for 循环先初始化计数器，每次迭代前检查条件，循环体后执行更新。i < 4 时，进入循环体的值是 0、1、2、3。把 < 改为 <= 会增加一次迭代，并可能导致数组越界。"],
        ["A total accumulates values, while a count records how many values satisfy a condition. Initialize both before the loop. In the example, only even i values contribute to the total, so the output is 6.", "总和累加数值，计数器记录符合条件的数值个数，两者都应在循环前初始化。示例只累加偶数 i，结果是 6。"],
      ], `public class Demo {
    public static void main(String[] args) {
        int total = 0;
        for (int i = 1; i <= 4; i++) {
            if (i % 2 == 0) {
                total += i;
            }
        }
        System.out.println(total);
    }
}`, "java"),
      section(["Use short-circuit evaluation", "利用短路求值"], [
        ["In a && b, Java evaluates b only if a is true. In a || b, it evaluates b only if a is false. A guard such as index < values.length && values[index] != 0 checks the bound before accessing the array.", "对于 a && b，只有 a 为真时 Java 才计算 b；对于 a || b，只有 a 为假时才计算 b。index < values.length && values[index] != 0 会先检查边界，再访问数组。"],
        ["For nested loops, count how many times the inner body runs for each outer value. If each of n rows scans n columns, the body runs n squared times. Doubling n approximately quadruples that work.", "追踪嵌套循环时，分别计算每个外层值对应的内层执行次数。n 行各扫描 n 列，循环体执行 n 的平方次；n 翻倍，工作量约为四倍。"],
      ]),
    ], ["Why must the bounds check come before an array access in an && condition?", "为什么 && 条件中应先检查边界，再访问数组？"], ["Short-circuiting skips the access when the bounds check is false. Reversing the order can access an invalid index first.", "边界条件为假时，短路求值会跳过数组访问。反过来写可能先访问无效索引。"]),
  lesson("class-creation", ["Create a class with an invariant", "创建带有不变量的类"],
    ["Use private fields, a constructor, instance methods, and separate object state.", "使用私有字段、构造器、实例方法和独立对象状态。"], ["Class creation", "创建类"], [
      section(["Encapsulate the state", "封装状态"], [
        ["A class defines a type; an object is one instance of it. A constructor establishes the initial state. Private fields prevent outside code from assigning directly to the representation, while public methods define the operations that callers may request.", "类定义一种类型，对象是它的一个实例。构造器建立初始状态。私有字段限制外部代码直接赋值，公共方法定义调用者可以请求的操作。"],
        ["An invariant is a condition the class promises to preserve. Counter keeps value non-negative. Its add method accepts only positive amounts, so callers cannot use it to make the value negative. Each Counter has its own instance field.", "不变量是类承诺保持的条件。Counter 保证 value 非负；add 只接受正数，因此调用者不能通过它把值变成负数。每个 Counter 都有独立的实例字段。"],
      ], `public class Demo {
    static class Counter {
        private int value;
        public Counter() { value = 0; }
        public void add(int amount) {
            if (amount > 0) { value += amount; }
        }
        public int getValue() { return value; }
    }
    public static void main(String[] args) {
        Counter first = new Counter();
        Counter second = new Counter();
        first.add(3);
        System.out.println(first.getValue());
        System.out.println(second.getValue());
    }
}`, "java"),
      section(["Distinguish instance and class members", "区分实例成员与类成员"], [
        ["An instance method acts on a particular receiver object. A static method belongs to the class and has no implicit receiver. A static field is shared by the class; making value static would cause the counters in this example to share their count.", "实例方法作用于特定的接收对象。static 方法属于类，没有隐式接收对象。static 字段由整个类共享；如果把 value 改为 static，示例中的计数器就会共享数值。"],
        ["Test two objects as well as one. Check initialization, a normal update, and an input that should be rejected. Explain preconditions, postconditions, and which methods are responsible for maintaining the invariant.", "除了测试单个对象，也要测试两个对象。检查初始化、正常更新和应被拒绝的输入，并解释前置条件、后置条件以及哪些方法负责维持不变量。"],
      ]),
    ], ["What does the example print, and why?", "示例输出什么，为什么？"], ["3 then 0. The two objects have separate instance fields; adding to first does not update second.", "先输出 3，再输出 0。两个对象的实例字段独立，修改 first 不会更新 second。"]),
  lesson("arrays-and-arraylists", ["Traverse arrays and ArrayList", "遍历数组与 ArrayList"],
    ["Choose a collection, handle its bounds, and remove elements without skipping them.", "选择集合、处理边界，并在删除元素时避免遗漏。"], ["Data collections", "数据集合"], [
      section(["Track size and valid positions", "追踪大小与有效位置"], [
        ["An array has a fixed length. An ArrayList can change its size. Both use zero-based positions: an array's last valid index is length - 1 and an ArrayList's is size() - 1. A two-dimensional array is indexed by row and then column.", "数组长度固定，ArrayList 的大小可改变。两者都从 0 开始索引，最后有效位置分别是 length - 1 与 size() - 1。二维数组先按行、再按列索引。"],
        ["Removing an ArrayList element shifts later elements left. When removing through a forward index, the next element can move into the position you just visited. A backwards traversal avoids skipping it.", "删除 ArrayList 元素后，后面的元素向左移动。正向遍历删除时，下一个元素可能移动到刚访问的位置。倒序遍历可以避免遗漏。"],
      ], `import java.util.ArrayList;
public class Demo {
    public static void main(String[] args) {
        ArrayList<Integer> scores = new ArrayList<Integer>();
        scores.add(40); scores.add(35); scores.add(70);
        for (int i = scores.size() - 1; i >= 0; i--) {
            if (scores.get(i) < 50) { scores.remove(i); }
        }
        System.out.println(scores);
    }
}`, "java"),
      section(["Test the traversal", "测试遍历过程"], [
        ["The example prints [70]. Test an empty collection, all matching elements, and consecutive matching elements. For two-dimensional arrays, use each row's length rather than assuming all rows have the same number of columns.", "示例输出 [70]。还应测试空集合、全部匹配和连续匹配的元素。遍历二维数组时使用每一行自己的长度，不要假设所有行的列数相同。"],
        ["When reading a dataset from a text file, separate parsing from analysis. Check missing or malformed values before adding them to a collection. A successful traversal cannot repair incorrect assumptions about the input data.", "从文本文件读取数据时，应把解析与分析分开。加入集合前检查缺失或格式错误的值。遍历正确不能弥补对输入数据的错误假设。"],
      ]),
    ], ["Why would a forward removal loop miss two adjacent low scores?", "为什么正向删除循环可能漏掉两个相邻低分中的一个？"], ["After the first removal the second score shifts left, then the loop increments past its new index.", "删除第一个后，第二个向左移，而循环又增加索引，因此跳过了它的新位置。"]),
  lesson("searching-sorting-recursion", ["Reason about search, sort, and recursion", "分析搜索、排序与递归"],
    ["Trace algorithm boundaries, recursive calls, and how input size affects work.", "追踪算法边界、递归调用与输入规模对工作量的影响。"], ["Data collections", "数据集合"], [
      section(["Identify the algorithm's promise", "明确算法保证的性质"], [
        ["Linear search inspects each element until it finds a match or reaches the end. Binary search maintains a sorted candidate range and discards the half that cannot contain the target. It is not correct to apply binary search to an arbitrary unsorted array.", "线性搜索逐个检查元素，直到找到匹配或到达末尾。二分搜索维护已排序的候选范围，并排除不可能含目标的一半。不能对任意未排序数组直接使用二分搜索。"],
        ["For insertion sort, the prefix before the current position is already sorted. Insert the next element into that prefix by shifting larger values right. Use a small trace to check that moving values does not overwrite an element you still need.", "插入排序中，当前位置之前的前缀已排序。将较大元素右移，再把下一个元素放入此前缀。通过小规模追踪检查移动时是否覆盖了仍需要的值。"],
      ], undefined, undefined, { kind: "search", values: [2, 5, 9, 12, 17], target: 12 }),
      section(["Every recursion needs progress and a base case", "递归需要推进与基本情况"], [
        ["A recursive method calls itself on a smaller or simpler problem. The base case returns without another call. sumTo(3) waits for sumTo(2), which waits for sumTo(1), which waits for sumTo(0). Returns then travel back up the call stack.", "递归方法在更小或更简单的问题上调用自身，基本情况不再递归。sumTo(3) 等待 sumTo(2)，后者等待 sumTo(1)，再等待 sumTo(0)。返回值随后沿调用栈逐层传回。"],
        ["The method below has the precondition n >= 0 and prints 6 for n = 3. Tracing only the calls is insufficient: also trace the pending additions during the returns. Test n = 0 to verify the stopping condition.", "下面方法的前置条件是 n >= 0，n = 3 时输出 6。追踪调用还不够，也要记录返回时等待执行的加法。测试 n = 0 以验证停止条件。"],
      ], `public class Demo {
    public static int sumTo(int n) {
        if (n == 0) { return 0; }
        return n + sumTo(n - 1);
    }
    public static void main(String[] args) {
        System.out.println(sumTo(3));
    }
}`, "java"),
    ], ["What goes wrong if the recursive method calls sumTo(n) instead of sumTo(n - 1)?", "递归中若调用 sumTo(n) 而不是 sumTo(n - 1)，会发生什么？"], ["The problem does not get smaller. For positive n, the base case is never reached and the call stack eventually overflows.", "问题规模没有缩小。n 为正时永远到不了基本情况，调用栈最终会溢出。"]),
];
