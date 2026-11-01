import { lesson, section, type Lesson } from "./types";

export const ibCore: Lesson[] = [
  lesson("computer-fundamentals", ["Explain computer fundamentals", "解释计算机基础"],
    ["Connect representation, processor execution, memory, and system choices.", "连接数据表示、处理器执行、内存与系统选择。"], ["A.1 Computer fundamentals", "A.1 计算机基础"], [
      section(["Follow a program through the system", "追踪程序在系统中的执行"], [
        ["A stored program keeps instructions and data in memory. The processor fetches an instruction, decodes what it requests, and executes it. Registers hold values needed immediately; cache can reduce waiting for frequently used memory locations. More clock cycles per second do not by themselves describe how much useful work a processor completes.", "存储程序计算机把指令和数据放在内存中。处理器取出指令、译码并执行。寄存器保存立即需要的值，缓存减少对常用内存位置的等待。每秒时钟周期更多，并不直接等于完成更多有效工作。"],
        ["Distinguish volatile main memory from persistent storage. When comparing systems, connect a characteristic to the workload: a large image dataset may need more memory and storage bandwidth, while a small embedded controller may prioritize power consumption.", "区分易失性主存与持久存储。比较系统时，应把特性与任务联系起来：大型图像数据集可能需要更多内存和存储带宽，小型嵌入式控制器则可能更重视功耗。"],
      ], undefined, undefined, { kind: "flow", nodes: [{ label: "Fetch" }, { label: "Decode" }, { label: "Execute" }], layout: "cycle" }),
      section(["Choose a representation", "选择表示方法"], [
        ["A fixed number of bits provides a finite range of values. Unsigned integers and two's-complement integers interpret the same pattern differently. Character encodings map characters to numeric representations; an image also needs dimensions and color information to interpret its bits.", "固定数量的比特只能表示有限范围的值。无符号整数和补码整数对同一模式的解释不同。字符编码把字符映射到数值，解释图像比特还需要尺寸和颜色等信息。"],
        ["Explain a tradeoff using a particular use case. More image detail requires more storage before compression. A sensor recording may need sufficient precision, but adding precision beyond the measurement's reliability does not create better evidence.", "用具体情境解释取舍。图像细节更多，压缩前通常需要更大存储。传感器记录需要足够精度，但超过测量可靠性的精度不会让证据更好。"],
      ]),
    ], ["Why is clock speed alone an incomplete comparison of processors?", "为什么只比较时钟频率是不完整的？"], ["Useful work also depends on architecture, instructions per cycle, memory behavior, and the workload being measured.", "有效工作量还取决于架构、每周期完成的指令、内存行为及具体任务。"]),
  lesson("networks", ["Reason about network communication", "分析网络通信"],
    ["Explain layered protocols, addressing, routing, and secure communication.", "解释分层协议、寻址、路由与安全通信。"], ["A.2 Networks", "A.2 网络"], [
      section(["Separate the jobs of network services", "区分网络服务的职责"], [
        ["A protocol defines rules shared by communicating systems. Addressing identifies a destination, routing selects a path, and transport mechanisms handle delivery behavior. DNS looks up names; it does not deliver the requested web page itself.", "协议规定通信系统共同遵守的规则。寻址标识目的地，路由选择路径，传输机制处理交付行为。DNS 查询名称，但它本身不传输所请求的网页。"],
        ["Layering separates responsibilities so one implementation can change without replacing the entire network. Encapsulation attaches information needed by a lower layer; the receiver interprets and removes that information at the corresponding stage.", "分层分离职责，使某一层的实现可以改变，而无需替换整个网络。封装添加较低层所需的信息，接收方在相应阶段解释并移除这些信息。"],
      ]),
      section(["Evaluate a network design", "评价网络设计"], [
        ["For a school network, compare throughput, latency, coverage, reliability, and cost against the users' needs. Bandwidth is capacity; latency is delay. A high-capacity connection may still have enough delay to disrupt a live conversation.", "设计校园网络时，根据用户需求比较吞吐量、时延、覆盖、可靠性和成本。带宽表示容量，时延表示延迟。容量很高的连接仍可能有足以影响实时交流的延迟。"],
        ["Encryption protects message content, authentication helps establish identity, and authorization limits access. Redundancy improves resilience, but introduces cost and management work. Justify the design in the scenario rather than listing advantages without context.", "加密保护内容，认证帮助确认身份，授权限制访问。冗余提高韧性，却增加成本和管理工作。应结合题目情境论证设计，而不是脱离背景罗列优点。"],
      ]),
    ], ["Can high bandwidth guarantee a low-delay video call?", "高带宽一定能保证视频通话低延迟吗？"], ["No. Bandwidth and latency are different characteristics, and congestion or distant routing may still introduce delay.", "不能。带宽和时延是不同特性，拥塞或较远的路由仍可能造成延迟。"]),
  lesson("relational-databases", ["Design and query related tables", "设计并查询关联表"],
    ["Use keys, relationships, joins, and constraints to keep a database consistent.", "使用键、关系、连接和约束保持数据库一致性。"], ["A.3 Databases", "A.3 数据库"], [
      section(["Store each fact in the right place", "把每项事实放在正确的位置"], [
        ["A primary key uniquely identifies a row. A foreign key refers to a key in a related table. Store a student's details once in Student and relate enrollments through StudentID. Repeating the student's address in every enrollment creates an update problem when the address changes.", "主键唯一标识一行，外键引用关联表中的键。学生信息应在 Student 中存储一次，选课记录通过 StudentID 关联。如果每条选课记录都重复地址，地址改变时就会出现更新问题。"],
        ["A many-to-many relationship usually needs a linking table, such as Enrollment(StudentID, CourseID). Its key can combine both identifiers. Constraints express rules such as uniqueness and valid references; they do not replace understanding the data's meaning.", "多对多关系通常需要 Enrollment(StudentID, CourseID) 这样的连接表，主键可以由两个标识符组成。约束表达唯一性和有效引用等规则，但不能取代理解数据含义。"],
      ]),
      section(["Read a join as a relationship", "把连接理解为关系"], [
        ["The query matches student identifiers in the two tables, keeps enrollments in course CS, and returns student names. A WHERE condition filters rows after the relationship has been expressed. Check whether a question needs unique names, a count, or all matching records.", "查询匹配两个表中的学生标识符，保留课程 CS 的选课记录并返回姓名。WHERE 条件筛选行。还应确认题目要求的是不重复姓名、计数还是所有匹配记录。"],
        ["A transaction groups related operations into one logical change. If an enrollment operation updates multiple tables, a partial update could violate the rules of the system. Explain which changes must succeed or fail together.", "事务把相关操作组织为一个逻辑变更。若选课操作更新多个表，部分更新可能破坏系统规则。需要明确哪些修改必须同时成功或同时失败。"],
      ], `SELECT Student.Name
FROM Student
INNER JOIN Enrollment
ON Student.StudentID = Enrollment.StudentID
WHERE Enrollment.CourseID = 'CS';`, "sql"),
    ], ["Why should a student's name not be the only primary key?", "为什么不应只用学生姓名作主键？"], ["Two students may share a name, and a name can change. Use a stable unique identifier.", "学生可能重名，姓名也可能改变。应使用稳定且唯一的标识符。"]),
  lesson("machine-learning", ["Train and evaluate a simple classifier", "训练并评价简单分类器"],
    ["Distinguish training from prediction and explain generalization, bias, and evaluation.", "区分训练与预测，解释泛化、偏差与评价。"], ["A.4 Machine learning", "A.4 机器学习"], [
      section(["Learn a pattern from examples", "从样例中学习规律"], [
        ["In supervised learning, training examples contain features and known target labels. A spam classifier might use features of messages and labels such as spam or legitimate. Training adjusts the model using those examples; prediction applies the learned model to a new message.", "监督学习的训练样例包含特征和已知标签。垃圾邮件分类器可使用消息特征，以及垃圾邮件或正常邮件等标签。训练利用样例调整模型，预测则把学到的模型应用于新消息。"],
        ["Unsupervised learning instead looks for structure without supplied target labels, such as clusters of similar messages. The clusters are not automatically meaningful categories; someone still needs to interpret the result in context.", "无监督学习在没有目标标签的情况下寻找结构，例如相似消息的聚类。聚类结果并不会自动成为有意义的类别，仍需结合情境解释。"],
      ]),
      section(["Evaluate on unseen data", "用未见数据进行评价"], [
        ["A model can memorize its training data and perform poorly on new examples. Keep test examples separate from training, and avoid leaking the answer through a feature. Evaluate data representative of the people and situations where the model will be used.", "模型可能记住训练数据，却无法处理新样例。测试样例应与训练数据分离，特征也不应泄露答案。评价数据应代表实际使用时的人群和情境。"],
        ["If 95 of 100 messages are legitimate, a model that always says legitimate has 95% accuracy while missing every spam message. Inspect false positives and false negatives and explain their different consequences for the user.", "100 封邮件中若有 95 封正常邮件，总是预测正常的模型准确率为 95%，却漏掉所有垃圾邮件。应分析误报与漏报，并解释两者对用户的不同影响。"],
      ], undefined, undefined, { kind: "table", columns: ["", "Predicted spam", "Predicted legitimate"], rows: [["Actual spam", "4", "1"], ["Actual legitimate", "3", "92"]] }),
    ], ["Why is training accuracy insufficient evidence that a model will work well?", "为什么训练准确率不足以证明模型有效？"], ["It measures examples already used to fit the model. Unseen, representative test data is needed to assess generalization.", "它衡量的是已经参与拟合的样例。评价泛化需要有代表性的未见测试数据。"]),
  lesson("computational-thinking", ["Specify a computational problem", "定义计算问题"],
    ["Use decomposition, abstraction, success criteria, and algorithm traces.", "使用分解、抽象、成功标准和算法追踪。"], ["B.1 Computational thinking", "B.1 计算思维"], [
      section(["Write observable success criteria", "编写可观察的成功标准"], [
        ["Replace 'the system should be good' with a statement someone can test: a booking system must reject an overlapping room reservation. Specify the input, required output, constraints, and what should happen for invalid input.", "把“系统应该很好”改为可测试的陈述，例如预订系统必须拒绝时间重叠的房间预约。明确输入、输出、限制以及无效输入的处理方式。"],
        ["Decompose the system into smaller jobs, such as reading a request, finding conflicts, and storing a confirmed booking. Abstraction keeps the details needed for a particular decision and leaves out irrelevant ones, such as a user's avatar when checking room availability.", "把系统分解为读取请求、查找冲突、保存已确认预约等任务。抽象保留特定决策所需的细节，忽略无关信息，例如检查房间是否可用时无需考虑用户头像。"],
      ]),
      section(["Prove behavior with a trace", "通过追踪验证行为"], [
        ["Trace each change in state rather than guessing from the first and last line. For overlapping intervals, test a full overlap, partial overlap, no overlap, and a reservation starting exactly when another ends. Decide whether the end time is inclusive before implementing the condition.", "应追踪每次状态变化，而不是只看首尾语句猜测结果。检查区间重叠时，测试完全重叠、部分重叠、不重叠以及前一预约结束时新预约恰好开始的情况。实现前先约定结束时间是否包含在内。"],
        ["A solution can meet its original tests yet fail the client's real need. Use feedback to refine the problem specification, then update both the algorithm and its tests so they describe the same intended behavior.", "解决方案可能通过原有测试，却没有满足客户的真实需要。应根据反馈改进问题定义，并同步更新算法与测试，使两者描述同一预期行为。"],
      ]),
    ], ["What makes a success criterion useful for evaluation?", "什么样的成功标准才有助于评价？"], ["It describes an observable result under stated conditions, so a test can show whether it was met.", "它在明确条件下描述可观察的结果，因此可以通过测试判断是否达到。"]),
  lesson("programming", ["Write and test Python programs", "编写并测试 Python 程序"],
    ["Use functions, conditions, iteration, and zero-based sequence indexing.", "使用函数、条件、迭代和从 0 开始的序列索引。"], ["B.2 Programming", "B.2 编程"], [
      section(["Make the algorithm explicit", "明确表达算法"], [
        ["A function groups a calculation under a name and receives input through parameters. The example counts values at or above a threshold. The local count starts at zero on each call, and return passes the result back without printing it.", "函数把计算组织在名称之下，通过参数接收输入。示例统计不小于阈值的数值，每次调用都把局部计数初始化为零，return 返回结果而不直接输出。"],
        ["Python sequences use zero-based indexing. A for-each traversal is useful when only the value matters; use an index when the position is needed. Indentation defines the body of a condition, loop, or function.", "Python 序列从 0 开始索引。只关心值时可直接遍历元素，需要位置时再使用索引。缩进定义条件、循环与函数的代码块。"],
      ], `def count_at_least(values, threshold):
    count = 0
    for value in values:
        if value >= threshold:
            count += 1
    return count

print(count_at_least([40, 50, 80], 50))`, "python"),
      section(["Choose tests that expose mistakes", "选择能暴露错误的测试"], [
        ["For this function, test an empty list, no qualifying values, all qualifying values, and a value equal to the threshold. The equality case distinguishes >= from >. State the expected result before running the program.", "测试这个函数时，应包含空列表、没有符合条件的值、全部符合条件以及恰好等于阈值的情况。相等情况能区分 >= 和 >。运行前先写出预期结果。"],
        ["Separate input and output from the calculation so the same algorithm is easy to test with different values. If reading a file, define how malformed records and missing data will be handled before including them in the analysis.", "把输入输出与计算分离，便于使用不同数据测试同一算法。读取文件时，应在分析前定义如何处理格式错误记录和缺失数据。"],
      ]),
    ], ["What should count_at_least([], 50) return?", "count_at_least([], 50) 应返回什么？"], ["0. There are no values to count, and the initialized total is returned.", "返回 0。没有数值可供计数，因此返回初始化的计数。"]),
  lesson("object-oriented-programming", ["Model state with objects", "用对象建模状态"],
    ["Create classes, initialize instances, and maintain an object's rules.", "创建类、初始化实例，并维护对象规则。"], ["B.3 Object oriented programming", "B.3 面向对象编程"], [
      section(["An object combines state and behavior", "对象结合状态与行为"], [
        ["A class describes the attributes and operations of a kind of object. An instance holds particular state. Two Account objects may use the same methods but have different balances. The initializer sets each object's starting state.", "类描述某类对象的属性和操作，实例保存具体状态。两个 Account 对象可以使用相同的方法，却有不同余额。初始化方法为每个对象建立起始状态。"],
        ["The deposit operation below rejects non-positive amounts. Keeping validation with the operation makes it easier to preserve the rule that deposits increase the balance. In Python, the leading underscore marks an attribute as non-public by convention rather than enforcing access protection.", "下面的 deposit 操作拒绝非正金额。把验证放在操作内部，有助于保持“存款增加余额”的规则。在 Python 中，属性前的下划线表示非公开约定，并不强制实施访问保护。"],
      ], `class Account:
    def __init__(self):
        self._balance = 0

    def deposit(self, amount):
        if amount > 0:
            self._balance += amount

    def balance(self):
        return self._balance

account = Account()
account.deposit(20)
print(account.balance())`, "python"),
      section(["Choose responsibilities carefully", "合理分配职责"], [
        ["A booking object might describe a reservation while a booking service checks availability across reservations. Assigning every task to one large class makes it harder to explain, test, and change the solution. Use relationships between objects to reflect the model.", "预约对象可描述一条预约，预约服务则检查多条预约之间是否冲突。把所有任务放在一个大类中，会增加解释、测试和修改的难度。应通过对象关系表达模型。"],
        ["Test object state before and after each operation, including rejected operations. Check that updating one instance does not unexpectedly alter another. A class diagram should communicate responsibilities and relationships, not simply reproduce every line of code.", "测试每次操作前后的对象状态，包括被拒绝的操作。检查更新一个实例是否意外影响另一实例。类图应传达职责和关系，而不是逐行复制代码。"],
      ]),
    ], ["If two accounts are created, should depositing into one update both?", "创建两个账户后，给一个存款应同时更新两个账户吗？"], ["No. Each account has its own instance state. Shared state would need a deliberate design justification.", "不应。每个账户拥有独立的实例状态。共享状态需要明确的设计理由。"]),
  lesson("case-study-and-project", ["Investigate a case and develop a solution", "研究案例并开发解决方案"],
    ["Connect evidence, a real problem, test criteria, and evaluation in IB work.", "把证据、真实问题、测试标准与评价联系起来。"], ["Case study and computational solution", "案例研究与计算解决方案"], [
      section(["Turn research into an explanation", "把研究转化为解释"], [
        ["Read the assigned case study to identify the system, stakeholders, terminology, and decisions that need investigation. Distinguish what the case actually states from your assumptions. Research unfamiliar technology using evidence, then apply the concepts to the scenario.", "阅读指定案例，找出系统、利益相关者、术语和待研究的决策。区分案例给出的事实与自己的假设。利用证据研究陌生技术，再将概念应用于具体情境。"],
        ["An evaluation should explain a consequence for a stakeholder and weigh a relevant alternative. A generic list of benefits of AI or databases will not establish why a particular design fits this case.", "评价应解释某项选择对利益相关者的后果，并权衡相关替代方案。笼统罗列 AI 或数据库的优点，不能证明某种设计适合当前案例。"],
      ]),
      section(["Develop against testable criteria", "根据可测试标准进行开发"], [
        ["Choose a real problem, establish what a successful solution must do, and design a manageable implementation. Keep evidence connecting the problem, the design, the developed program, and the evaluation. Record sources and assistance honestly.", "选择真实问题，明确成功解决方案必须做到什么，再设计规模可控的实现。保留连接问题、设计、程序与评价的证据，并如实记录来源与获得的帮助。"],
        ["Evaluate each success criterion using actual results and feedback. Describe limitations and an improvement that addresses one of them. Check the current guide supplied by your school for the exact requirements of the computational solution and collaborative sciences project.", "使用实际结果和反馈逐项评价成功标准，说明局限以及针对其中一项的改进。计算解决方案和协作科学项目的具体要求，应查阅学校提供的当前指南。"],
      ]),
    ], ["Why should evaluation refer back to success criteria?", "为什么评价应回到成功标准？"], ["The criteria state the intended result. Linking evidence to each criterion shows what the solution actually achieved and what remains incomplete.", "标准规定了预期结果。将证据与每项标准关联，才能说明解决方案实际实现了什么，以及哪些尚未完成。"]),
];

export const ibHl: Lesson[] = [
  lesson("abstract-data-types", ["Implement stacks and queues", "实现栈与队列"],
    ["Separate an abstract interface from its representation and handle empty or full states.", "分离抽象接口与表示方法，并处理空或满状态。"], ["B.4 Abstract data types · HL", "B.4 抽象数据类型 · HL"], [
      section(["Define behavior before storage", "先定义行为，再选择存储"], [
        ["A stack removes the most recently added item first. A queue removes the earliest added item first. These rules define observable behavior, not a particular array or linked representation. Clients use the operations without relying on where the values are stored.", "栈先移除最近加入的元素，队列先移除最早加入的元素。这些规则定义可观察行为，而不是某一种数组或链式表示。调用者通过操作使用结构，无需依赖值存放的位置。"],
        ["A bounded array stack can use a top index. Push must check capacity before increasing top; pop must check whether the stack is empty before reading. Decide what the caller receives on failure rather than returning a value indistinguishable from stored data.", "有界数组栈可以使用栈顶索引。入栈先检查容量，再增加索引；出栈先检查是否为空，再读取。应明确失败时如何通知调用者，避免返回与正常数据无法区分的值。"],
      ]),
      section(["Trace a circular queue", "追踪循环队列"], [
        ["A circular queue reuses space by wrapping its front and rear indices. With capacity 4, advancing an index can use (index + 1) % 4. A count of stored elements can distinguish empty from full even when the indices coincide.", "循环队列通过首尾索引回绕复用空间。容量为 4 时，可用 (index + 1) % 4 推进索引。记录元素个数能在索引相同时区分空与满。"],
        ["For enqueue A, enqueue B, dequeue, enqueue C, a queue removes A and leaves B before C. A stack with the corresponding push and pop operations would remove B. Use the order requirement to justify the data type.", "依次执行入队 A、入队 B、出队、入队 C，队列移除 A，并让 B 位于 C 前。栈执行对应入栈与出栈操作时则移除 B。应根据顺序要求选择数据类型。"],
      ]),
    ], ["Which structure naturally represents jobs waiting in arrival order?", "哪种结构自然表示按到达顺序等待的任务？"], ["A queue, because it is first in, first out.", "队列，因为它遵循先进先出。"]),
  lesson("linked-structures-and-trees", ["Trace linked structures and trees", "追踪链式结构与树"],
    ["Reason about references, recursive structure, and traversal order.", "分析引用、递归结构与遍历顺序。"], ["B.4 Abstract data types · HL", "B.4 抽象数据类型 · HL"], [
      section(["A link stores a relationship", "链接存储关系"], [
        ["A linked list stores a value and a reference to the next node. To insert a node after the current node, preserve the old next reference before replacing it. Losing the reference can make the remainder of the list unreachable from the head.", "链表节点保存一个值以及指向下一节点的引用。在当前节点后插入节点时，应先保存原来的 next 引用再替换。丢失引用可能使后续节点无法从表头到达。"],
        ["A binary search tree places smaller keys in the left subtree and larger keys in the right subtree, with an explicit policy for equal keys. Search compares at a node and selects one subtree; it does not scan both when the ordering rule applies.", "二叉搜索树把较小键放入左子树，较大键放入右子树，并明确相等键的处理规则。符合排序规则时，搜索在当前节点比较后只需选择一侧子树。"],
      ], undefined, undefined, { kind: "structure", root: { label: "8", children: [{ label: "3", children: [{ label: "1" }, { label: "6" }] }, { label: "12" }] } }),
      section(["Distinguish shape from efficiency", "区分树形与效率"], [
        ["An inorder traversal visits the left subtree, the node, and the right subtree. For a valid binary search tree, that yields keys in order. Recursion stops when the subtree is empty. Preorder and postorder choose different positions for the node visit.", "中序遍历按左子树、当前节点、右子树的顺序访问。对有效二叉搜索树，它产生有序键。子树为空时停止递归。前序与后序遍历对当前节点的访问位置不同。"],
        ["A balanced tree can reduce a search to a logarithmic number of levels, but repeated insertions in sorted order can produce a long chain in an unbalanced tree. Explain efficiency using the shape actually produced, rather than assuming all trees are balanced.", "平衡树可把搜索层数降至对数级，但在不平衡树中按有序顺序连续插入，可能形成很长的链。应根据实际树形分析效率，而不是默认所有树都平衡。"],
      ]),
    ], ["What is the inorder traversal of the pictured tree?", "图中树的中序遍历是什么？"], ["1, 3, 6, 8, 12. Each node is visited between its left and right subtrees.", "是 1、3、6、8、12。每个节点都在它的左右子树之间访问。"]),
  lesson("hl-models-and-evaluation", ["Compare HL models and algorithms", "比较 HL 模型与算法"],
    ["Use inheritance, recursion, and model evaluation to defend design decisions.", "利用继承、递归与模型评价论证设计决定。"], ["HL extension", "HL 扩展"], [
      section(["Model a valid substitution", "建立有效的替换关系"], [
        ["Inheritance models an is-a relationship. A subclass can provide specialized behavior while preserving the contract expected by code using the base type. Composition models a has-a relationship instead: a booking has a customer rather than being a customer.", "继承表达“是一种”的关系。子类可提供专门行为，同时遵守使用基类代码所期待的约定。组合表达“拥有”关系，例如预约拥有客户，而不是一种客户。"],
        ["Polymorphism lets a call select behavior from the actual object's type. Test both the common contract and each specialized behavior. A hierarchy that shares field names but cannot preserve the expected behavior is a weak model.", "多态使调用根据实际对象类型选择行为。应同时测试共同约定与各类专门行为。如果层次结构只共享字段名称，却无法保持预期行为，就不是合适的模型。"],
      ]),
      section(["Compare cost and evidence", "比较成本与证据"], [
        ["For recursion, identify a base case, a smaller subproblem, and work waiting on the call stack. Compare a linear traversal with repeated scans of the same data. Space used by recursive calls is part of the algorithm's resource cost.", "分析递归时应指出基本情况、更小的子问题和调用栈上等待执行的工作。比较一次线性遍历与重复扫描相同数据的方案。递归调用占用的空间也是算法成本。"],
        ["For a classifier, inspect a confusion matrix and performance across relevant groups rather than reporting only one overall accuracy. A higher score on leaked or unrepresentative data is not a reliable improvement. Explain which costs and mistakes matter in the application.", "评价分类器时，检查混淆矩阵及相关群体的表现，而不只报告整体准确率。存在数据泄漏或缺乏代表性时，更高分数不一定意味着改进。应说明应用中哪些成本和错误更重要。"],
      ]),
    ], ["Why might composition fit a Booking and Customer better than inheritance?", "为什么 Booking 与 Customer 更适合组合而不是继承？"], ["A booking has a customer; it is not a kind of customer and cannot substitute for one.", "预约拥有一个客户，但预约不是一种客户，无法替代客户。"]),
];
