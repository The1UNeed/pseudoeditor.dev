import { lesson, section, type Lesson } from "./types";

export const aLevel: Lesson[] = [
  lesson("representation-and-communication", ["Represent information and transmit it", "表示并传输信息"],
    ["Connect number representations, multimedia size, compression, and network delivery.", "连接数值表示、多媒体大小、压缩与网络传输。"], ["AS Level · Topics 1–2", "AS Level · 主题 1–2"], [
      section(["Interpret the bit pattern", "解释比特模式"], [
        ["An eight-bit unsigned value ranges from 0 to 255. With two's complement, the most significant bit has weight -128, so the same eight bits can represent -128 to 127. Always state the representation before converting a pattern.", "八位无符号值范围是 0 到 255。补码中最高位的权重是 -128，因此同样八位可表示 -128 到 127。转换模式前应先说明表示方式。"],
        ["For an uncompressed bitmap, multiply width, height, and bits per pixel. For sampled sound, multiply sample rate, duration, resolution, and channels. Convert bits to bytes and use the units requested by the question before rounding.", "未压缩位图的大小由宽、高和每像素位数相乘得到。采样声音则计算采样率、时长、分辨率与声道数的乘积。先把比特换算成字节并使用题目要求的单位，再按需取整。"],
      ], undefined, undefined, { kind: "binary", value: 249, bits: 8, mode: "twos" }),
      section(["Explain a transmission choice", "解释传输方案"], [
        ["Lossless compression keeps every detail needed to reconstruct the original; lossy compression trades information for smaller files. Choose based on the data: changing a bit in a program is different from losing a small visual detail in a photograph.", "无损压缩保留精确恢复原始内容所需的信息，有损压缩则用信息损失换取较小文件。应根据数据用途选择：程序中一位改变，与照片中少量细节丢失的后果不同。"],
        ["A network's addressing, routing, transmission medium, and protocols solve different problems. Explain which characteristic addresses the scenario's need. A fast local link does not remove congestion elsewhere in an internet path.", "网络的寻址、路由、介质和协议解决不同问题。应解释哪项特性满足情境中的需求。局部链路很快，并不能消除互联网其他路径上的拥塞。"],
      ]),
    ], ["What does 11111001 represent as an eight-bit two's-complement integer?", "11111001 作为八位补码整数表示什么？"], ["-7. Its unsigned value is 249, and 249 - 256 = -7.", "表示 -7。无符号值是 249，而 249 - 256 = -7。"]),
  lesson("hardware-and-processors", ["Trace processor operations", "追踪处理器操作"],
    ["Use registers, buses, assembly-style operations, and bit masks.", "使用寄存器、总线、类汇编操作与位掩码。"], ["AS Level · Topics 3–4", "AS Level · 主题 3–4"], [
      section(["Track data and addresses separately", "分别追踪数据与地址"], [
        ["The program counter identifies the next instruction. During a fetch, the memory address register holds the requested address, the memory data register holds the transferred value, and the current instruction register holds the instruction being decoded. An address is a location, not the value stored there.", "程序计数器指出下一条指令。取指时，内存地址寄存器保存请求地址，内存数据寄存器保存传输值，当前指令寄存器保存待译码指令。地址是位置，而不是该位置存储的值。"],
        ["Address, data, and control buses carry different information. To explain an instruction, trace which register supplies an address, what memory returns, and how the control unit directs execution. Keep the accumulator's changing value in a trace table.", "地址、数据和控制总线承载不同信息。解释指令时，追踪哪个寄存器提供地址、内存返回什么，以及控制单元如何指挥执行。用追踪表记录累加器变化。"],
      ]),
      section(["Use masks to isolate bits", "用掩码分离比特"], [
        ["Bitwise AND with a mask keeps only positions where the mask has a 1. OR can set selected bits, while XOR can toggle them. For example, AND with 00001111 extracts the low four bits without affecting their relative positions.", "按位 AND 掩码只保留掩码为 1 的位置。OR 可设置指定位，XOR 可翻转指定位。例如与 00001111 做 AND 可取出低四位，并保留它们的相对位置。"],
        ["Distinguish a bitwise operation on every bit from a Boolean operation on a whole condition. For a logic circuit, compute intermediate gate outputs before the final output, then test every input combination when constructing a truth table.", "区分逐位执行的位运算与针对完整条件的布尔运算。分析逻辑电路时，先计算中间逻辑门输出，再求最终结果；真值表应覆盖所有输入组合。"],
      ]),
    ], ["What is 10110110 AND 00001111?", "10110110 AND 00001111 的结果是什么？"], ["00000110. Only the low four input bits can remain set.", "是 00000110，只有输入的低四位可能保留为 1。"]),
  lesson("system-software", ["Explain operating systems and translation", "解释操作系统与翻译"],
    ["Separate resource management from the stages that turn source into executable code.", "区分资源管理与源代码变成可执行代码的阶段。"], ["AS Level · Topic 5", "AS Level · 主题 5"], [
      section(["Manage shared resources", "管理共享资源"], [
        ["An operating system manages processor time, memory, files, and devices. An interrupt requests attention from the processor. The system preserves enough state to resume the interrupted work after an appropriate handler has run.", "操作系统管理处理器时间、内存、文件和设备。中断请求处理器关注某个事件，系统保存足够的状态，以便处理程序完成后继续原来的工作。"],
        ["Different tasks need different responses. A printer finishing a job, a user pressing a key, and a timer expiring do not all require the running application to wait in a loop. Explain how a service frees the application from managing low-level hardware details.", "打印完成、用户按键与定时器到期等事件，不一定都需要应用忙等。应解释系统服务如何让应用免于直接管理底层硬件细节。"],
      ]),
      section(["Locate an error in the translation process", "定位翻译过程中的错误"], [
        ["Lexical analysis recognizes tokens, such as identifiers and operators. Syntax analysis checks whether those tokens follow the language grammar. Later checks can reject inconsistent types or undefined names. A valid grammar does not guarantee correct behavior.", "词法分析识别标识符和运算符等记号，语法分析检查记号是否符合语言文法。之后的检查可拒绝类型不一致或未定义名称。符合文法并不保证行为正确。"],
        ["A compiler translates code, while an interpreter executes through an interpretation process. Compare development feedback, execution needs, and deployment requirements in context rather than assuming one is always better.", "编译器负责翻译代码，解释器通过解释过程执行代码。比较时应结合开发反馈、执行需求与部署要求，而不是认为其中一种永远更好。"],
      ]),
    ], ["Is a wrong answer from a syntactically valid program necessarily a syntax error?", "语法正确的程序输出错误答案，一定是语法错误吗？"], ["No. It may be a logic error that translation cannot detect.", "不一定，它可能是翻译过程无法检测的逻辑错误。"]),
  lesson("security-privacy-and-ethics", ["Protect data and justify its use", "保护数据并论证其使用"],
    ["Connect threats, integrity checks, privacy, ownership, and ethical decisions.", "连接威胁、完整性检查、隐私、所有权与伦理决策。"], ["AS Level · Topics 6–7", "AS Level · 主题 6–7"], [
      section(["Match controls to the threat", "让控制措施对应威胁"], [
        ["Confidentiality restricts disclosure, integrity concerns unauthorized alteration, and availability concerns access when needed. Authentication, authorization, encryption, and backups address different aspects. Name the asset and attack before proposing a control.", "保密性限制泄露，完整性关注未经授权的修改，可用性关注需要时能否访问。认证、授权、加密和备份解决不同问题。提出措施前应先明确资产与攻击。"],
        ["Validation checks whether input follows specified rules; verification checks whether a transfer or entry matches its source. A valid-looking date may still have been entered incorrectly. State what each check can and cannot establish.", "验证输入规则与核实输入是否符合原始来源是不同任务。日期格式有效，也可能与原始信息不一致。应说明每项检查能够与不能够证明什么。"],
      ]),
      section(["Evaluate stakeholders and ownership", "评价利益相关者与所有权"], [
        ["A school may find activity logs useful for diagnosis while students reasonably expect limits on collection and access. Identify the purpose, minimum necessary data, retention period, and who can read the records.", "学校可能用活动日志诊断问题，学生也有理由期待数据收集和访问受到限制。应明确目的、最少必要数据、保留时间及可读取人员。"],
        ["Respect licenses and acknowledge sources when reusing software or media. A technically possible action is not automatically an ethical one. Compare the effect on affected groups and explain an alternative that reduces a specific harm.", "复用软件或素材时，应遵守许可并注明来源。技术上做得到，不代表伦理上就合理。应比较对不同群体的影响，并提出能减少具体危害的替代方案。"],
      ]),
    ], ["Does checking that a mark is between 0 and 100 prove that it was copied correctly?", "检查分数在 0 到 100 之间，能证明抄录正确吗？"], ["No. It validates the range but does not verify the value against the original record.", "不能。它验证范围，但没有与原始记录核对数值。"]),
  lesson("database-design", ["Normalize a relational database", "规范化关系数据库"],
    ["Use functional dependencies, keys, SQL, and transaction rules.", "使用函数依赖、键、SQL 与事务规则。"], ["AS Level · Topic 8", "AS Level · 主题 8"], [
      section(["Identify what determines each fact", "识别每项事实由什么决定"], [
        ["A primary key identifies a row, while a functional dependency says that one set of attributes determines another. If OrderID determines CustomerID and CustomerID determines CustomerName, repeating the name in every order creates a transitive dependency.", "主键标识一行，函数依赖则说明一组属性决定另一组属性。如果 OrderID 决定 CustomerID，CustomerID 又决定 CustomerName，那么在每条订单重复姓名会形成传递依赖。"],
        ["Normalization separates related facts to reduce update, insertion, and deletion anomalies. Keep a key connecting the tables after decomposition. Splitting a table without preserving its relationships does not produce a useful design.", "规范化通过分离相关事实来减少更新、插入和删除异常。拆分后应保留连接表之间的键。只拆表却丢失关系，并不能得到有效设计。"],
      ]),
      section(["Ask SQL for the required result", "用 SQL 表达所需结果"], [
        ["SELECT retrieves data; JOIN relates tables; WHERE filters rows; GROUP BY forms groups for aggregates. The example counts orders per customer. Check whether customers with no orders should appear before choosing an inner or outer join.", "SELECT 检索数据，JOIN 关联表，WHERE 筛选行，GROUP BY 为聚合分组。示例统计每个客户的订单数。选择内连接或外连接前，应明确是否要显示没有订单的客户。"],
        ["A database management system also enforces constraints and manages concurrent changes. Related updates, such as reducing stock and recording a sale, should not leave an inconsistent partial result when one operation fails.", "数据库管理系统还负责约束与并发修改。减少库存和记录销售等相关更新，不应在某个操作失败时留下不一致的部分结果。"],
      ], `SELECT CustomerID, COUNT(*) AS OrderCount
FROM Orders
GROUP BY CustomerID;`, "sql"),
    ], ["Why move a customer's address out of repeated order rows?", "为什么应把客户地址从重复的订单记录中分离出来？"], ["It avoids updating many copies of the same fact and leaving inconsistent addresses.", "避免修改同一事实的多份副本，也减少地址不一致的风险。"]),
  lesson("as-algorithms-and-development", ["Design, trace, and test an AS program", "设计、追踪并测试 AS 程序"],
    ["Combine decomposition, records, arrays, subroutines, files, and a test plan.", "结合分解、记录、数组、子程序、文件和测试计划。"], ["AS Level · Topics 9–12", "AS Level · 主题 9–12"], [
      section(["Write a contract for each subroutine", "为子程序明确约定"], [
        ["Specify the input, output, and assumptions before choosing an algorithm. A record can group attributes of one item; an array holds multiple values addressed by an index. Choose bounds explicitly and distinguish a stored count from the array's capacity.", "选择算法前先明确输入、输出与假设。记录把单个对象的属性组合起来，数组则按索引存储多个值。应明确数组边界，并区分已存元素个数与数组容量。"],
        ["Use local variables to keep a subroutine's temporary work separate. A parameter passed by value supplies a value; a by-reference parameter can let the subroutine change the caller's storage. State the intended effect before deciding which is appropriate.", "用局部变量隔离子程序的临时工作。按值参数提供一个值，按引用参数则可能让子程序修改调用者的存储。应先明确预期影响，再选择传递方式。"],
      ], `DECLARE Marks : ARRAY[1:3] OF INTEGER
DECLARE Index : INTEGER
DECLARE Total : INTEGER
Marks[1] <- 40
Marks[2] <- 50
Marks[3] <- 80
Total <- 0
FOR Index <- 1 TO 3
    Total <- Total + Marks[Index]
NEXT Index
OUTPUT Total`, "pseudocode"),
      section(["Test the design as well as the code", "同时测试设计与代码"], [
        ["For the example, a trace should finish with Total = 170. Test first and last indices to expose boundary mistakes. For input routines, include normal, extreme, and invalid data and state the expected result of each test.", "示例的追踪结果应为 Total = 170。测试首尾索引能发现边界错误。对输入例程应设计正常、极端和无效数据，并写出各自的预期结果。"],
        ["The development cycle connects analysis, design, implementation, testing, and maintenance. For file processing, define the record format and end-of-file handling. After a maintenance change, rerun relevant tests to check previously working behavior.", "开发周期把分析、设计、实现、测试与维护联系起来。处理文件时应定义记录格式和文件结束处理。维护修改后应重新运行相关测试，检查原本正常的行为。"],
      ]),
    ], ["Does an array capacity of 100 mean that 100 meaningful items have been stored?", "数组容量为 100，是否说明已存储 100 个有意义的元素？"], ["No. Track the number of populated elements separately from allocated capacity.", "不说明。应将已填充元素个数与分配容量分开记录。"]),
  lesson("advanced-data-representation", ["Represent real numbers and organize files", "表示实数并组织文件"],
    ["Reason about floating-point precision, user-defined types, and file access.", "分析浮点精度、自定义类型与文件访问。"], ["A Level · Topic 13", "A Level · 主题 13"], [
      section(["Separate range from precision", "区分范围与精度"], [
        ["A floating-point representation stores a mantissa and an exponent. The exponent changes the scale; the mantissa carries significant information. With a fixed number of bits, increasing exponent space usually leaves fewer bits for precision.", "浮点表示存储尾数与指数。指数改变尺度，尾数保存有效信息。在总位数固定时，为指数分配更多位通常会减少精度位数。"],
        ["A value can be within range but not exactly representable. Rounding creates a small representation error which may accumulate through calculations. Normalization gives a consistent form and makes effective use of the available mantissa bits.", "一个值可能在范围内，却无法被精确表示。舍入带来小的表示误差，计算中可能累积。规格化提供一致形式，并有效利用尾数位。"],
      ]),
      section(["Match storage to access patterns", "根据访问模式选择存储方式"], [
        ["A record groups related fields. Enumerations restrict a value to named alternatives, while other user-defined types express a domain's structure. Choosing the type is part of modeling the problem, not just a way to shorten declarations.", "记录组合相关字段，枚举把值限制为具名选项，其他自定义类型表达问题领域的结构。选择类型是建模的一部分，并非只是简化声明。"],
        ["Sequential processing reads records in order. Direct access finds a location without reading every preceding record. A hash-based organization needs a collision policy because different keys can map to the same location. Consider searches, updates, and storage overhead together.", "顺序处理按次序读取记录，直接访问则无需读取前面所有记录就能定位。基于哈希的组织方式需要冲突处理，因为不同键可能映射到同一位置。应综合考虑搜索、更新与存储开销。"],
      ]),
    ], ["Does being within floating-point range imply an exact representation?", "在浮点数范围内，是否就能精确表示？"], ["No. The finite mantissa limits precision, so a representable range can still contain values requiring rounding.", "不能。有限尾数限制精度，即使在范围内，也可能需要舍入。"]),
  lesson("protocols-and-parallel-systems", ["Compare protocols and processor designs", "比较协议与处理器设计"],
    ["Connect switching, parallel execution, virtualization, and Boolean simplification.", "连接交换、并行执行、虚拟化与布尔化简。"], ["A Level · Topics 14–15", "A Level · 主题 14–15"], [
      section(["Explain the communication tradeoff", "解释通信取舍"], [
        ["Circuit switching reserves a path for a communication session. Packet switching shares links among packets and may use different routes. Compare setup needs, capacity use, and delay variability for the scenario instead of treating one method as universally superior.", "电路交换为会话保留路径，分组交换让数据包共享链路并可能采用不同路由。应结合情境比较建立连接的需求、容量利用率和延迟变化，而非认为其中一种永远更好。"],
        ["A protocol defines messages and behavior, not merely a port number. Explain how naming, addressing, delivery, and application protocols cooperate when a user accesses a service. Secure transport adds protection but does not repair an application's incorrect permissions.", "协议定义消息与行为，不只是端口号。应解释用户访问服务时，名称、寻址、交付与应用协议如何协作。安全传输增加保护，却不能修复应用的错误权限。"],
      ]),
      section(["Reason about execution resources", "分析执行资源"], [
        ["Parallel processing divides suitable work across execution resources, but dependencies and communication limit speedup. A virtual machine provides an execution environment separated from the underlying physical details, with a cost in management and resource use.", "并行处理把适合的任务分配给多个执行资源，但依赖与通信限制加速效果。虚拟机提供与底层物理细节分离的执行环境，同时带来管理与资源成本。"],
        ["For a logic expression, simplify using Boolean identities and confirm equivalence with a truth table. De Morgan's law changes both the operator and the negation: NOT(A AND B) equals NOT A OR NOT B. Test all input combinations, not only one convenient case.", "化简逻辑表达式时使用布尔恒等式，并用真值表确认等价。德摩根定律同时改变运算符与取反：NOT(A AND B) 等价于 NOT A OR NOT B。应测试所有输入组合。"],
      ]),
    ], ["Why does doubling the number of processors not guarantee half the execution time?", "为什么处理器数量翻倍不能保证时间减半？"], ["Sequential dependencies, communication, synchronization, and overhead can limit parallel work.", "串行依赖、通信、同步和额外开销都可能限制并行工作。"]),
  lesson("advanced-systems-and-security", ["Manage memory and establish trust", "管理内存并建立信任"],
    ["Explain scheduling, memory management, translation, and cryptographic trust.", "解释调度、内存管理、翻译与密码学信任。"], ["A Level · Topics 16–17", "A Level · 主题 16–17"], [
      section(["Share processor and memory fairly", "合理共享处理器与内存"], [
        ["A scheduler decides which ready process runs next. Different policies balance response time, throughput, and fairness. A time slice lets a process run for a bounded interval, but switching processes also costs time.", "调度器决定下一个运行的就绪进程。不同策略在响应时间、吞吐量与公平性之间取舍。时间片让进程运行一段有限时间，但切换进程本身也有成本。"],
        ["Virtual memory separates a process's address space from physical memory. Paging moves fixed-size units between memory and storage as needed. Excessive page faults can make a system spend more time moving pages than doing useful work.", "虚拟内存把进程地址空间与物理内存分离。分页按需在内存与存储之间移动固定大小的单元。缺页过多可能使系统大部分时间用于搬移页面，而非执行有效工作。"],
      ]),
      section(["Check identity as well as secrecy", "同时检查身份与保密性"], [
        ["Symmetric encryption uses a shared secret; asymmetric cryptography uses related public and private keys. A digital certificate associates an identity with a public key through a signature that must be verified against a trusted issuer.", "对称加密使用共享密钥，非对称密码学使用相关的公钥和私钥。数字证书通过签名把身份与公钥关联，该签名必须由可信发行者验证。"],
        ["Encrypting a connection to an impostor does not establish that the impostor is the intended service. Explain certificate validation, key protection, and the purpose of the protocol in the attack scenario. Translation and operating-system controls remain separate parts of the system.", "与冒充者建立加密连接，并不能证明对方就是目标服务。应结合攻击情境解释证书验证、密钥保护和协议目的。翻译与操作系统控制仍是不同的系统环节。"],
      ]),
    ], ["What can cause virtual memory to reduce performance sharply?", "什么情况可能使虚拟内存性能急剧下降？"], ["Frequent page faults and repeated transfer of pages between storage and main memory can dominate execution time.", "频繁缺页以及在存储与主存之间反复搬移页面，可能占据大部分执行时间。"]),
  lesson("artificial-intelligence", ["Represent knowledge and learn from data", "表示知识并从数据中学习"],
    ["Compare rule-based reasoning, search, machine learning, and neural networks.", "比较规则推理、搜索、机器学习与神经网络。"], ["A Level · Topic 18", "A Level · 主题 18"], [
      section(["Choose a reasoning model", "选择推理模型"], [
        ["A rule-based system applies explicit rules to stored facts. A search algorithm explores candidate states according to a strategy. A heuristic estimates which choices are promising, but its usefulness depends on the problem and on any guarantees the algorithm needs.", "基于规则的系统对事实应用明确规则，搜索算法则按策略探索候选状态。启发式估计哪些选择更有希望，但效果取决于具体问题以及算法所需保证。"],
        ["Representing a problem well matters as much as selecting a procedure. State what a node means, what transitions are allowed, and how a goal is recognized. A diagram without those meanings is not a complete search model.", "合理表示问题与选择算法同样重要。应说明节点含义、允许的状态转移以及目标判定方式。没有这些定义，图示就不是完整的搜索模型。"],
      ]),
      section(["Evaluate a learned model", "评价学习得到的模型"], [
        ["Supervised learning uses labeled examples, unsupervised learning looks for structure without supplied targets, and reinforcement learning uses feedback from actions. A neural network adjusts weights during training; it is not a collection of manually written answers for every possible input.", "监督学习使用带标签样例，无监督学习在没有目标标签时寻找结构，强化学习利用行动反馈。神经网络在训练中调整权重，不是人工为所有输入编写答案的集合。"],
        ["Keep evaluation data separate from training, inspect incorrect predictions, and consider bias and consequences. High training accuracy can indicate memorization instead of reliable behavior on unseen data. Explain whether false positives or false negatives are more costly in the scenario.", "评价数据应与训练数据分开，检查错误预测，并考虑偏差和后果。训练准确率高可能只是记忆，而非对新数据有效。应结合情境解释误报与漏报哪个代价更高。"],
      ]),
    ], ["Does a heuristic always guarantee the best solution?", "启发式一定保证最优解吗？"], ["No. Any guarantee depends on the search algorithm and the properties of the heuristic.", "不一定。能否保证最优，取决于搜索算法及启发式的性质。"]),
  lesson("advanced-algorithms", ["Trace recursion and dynamic structures", "追踪递归与动态结构"],
    ["Compare searches and sorts, reason about a call stack, and choose an abstract data type.", "比较搜索与排序、分析调用栈，并选择抽象数据类型。"], ["A Level · Topic 19", "A Level · 主题 19"], [
      section(["Make progress toward the base case", "向基本情况推进"], [
        ["A recursive solution defines a stopping case and reduces every other case toward it. The call stack stores work waiting for a smaller call to return. Trace both the descent and the returns to explain a recursive result.", "递归解决方案定义停止情况，并让其他情况逐步接近它。调用栈保存等待较小调用返回的工作。解释递归结果时应同时追踪进入与返回过程。"],
        ["Binary search reduces a sorted candidate range, while merge sort divides data and combines sorted results. Compare the amount of work and extra storage required. An algorithm's typical behavior does not automatically describe its worst case.", "二分搜索缩小已排序的候选范围，归并排序则分割数据再合并有序结果。应比较工作量与额外存储需求。算法的典型表现不能自动代表最坏情况。"],
      ]),
      section(["Choose behavior before representation", "先选择行为，再确定表示"], [
        ["A stack supports last-in-first-out access, a queue supports first-in-first-out access, and a binary search tree supports ordered navigation. Arrays and linked nodes are implementation choices. Explain empty and full conditions for any bounded implementation.", "栈遵循后进先出，队列遵循先进先出，二叉搜索树支持有序导航。数组与链接节点是实现方式。对有界实现应说明空与满的条件。"],
        ["For a linked insertion, preserve the next reference before changing it. For a tree traversal, define when the node is visited relative to its children. Use a small hand-worked example to verify that every required value is visited exactly once.", "链式插入时，应先保留 next 引用再修改。树遍历中应明确当前节点相对孩子节点的访问顺序。用手工小例验证每个所需值恰好访问一次。"],
      ], undefined, undefined, { kind: "sort", values: [7, 2, 5, 1] }),
    ], ["Why can a correct recursive algorithm still fail on a very deep input?", "为什么正确递归算法仍可能在很深的输入上失败？"], ["Its pending calls can exhaust available stack space. Correctness and resource limits are different questions.", "等待中的调用可能耗尽调用栈空间。正确性与资源限制是两个问题。"]),
  lesson("programming-paradigms", ["Develop and evaluate a practical solution", "开发并评价实践解决方案"],
    ["Use programming paradigms, file handling, exceptions, and systematic testing.", "使用编程范式、文件处理、异常与系统测试。"], ["A Level · Topic 20", "A Level · 主题 20"], [
      section(["Match the paradigm to the task", "根据任务选择范式"], [
        ["Procedural programming organizes steps into subroutines. Object-oriented programming combines state and behavior in objects. A declarative approach describes the desired result or relationships rather than every execution step. Compare the model with the problem rather than treating syntax as the whole paradigm.", "过程式编程把步骤组织为子程序，面向对象编程在对象中结合状态与行为，声明式方法描述所需结果或关系，而不是每一步执行。比较范式时应结合问题模型，而不只看语法。"],
        ["For an object model, define constructors, responsibilities, and valid state transitions. For inheritance, ask whether a subtype can meet the contract of the base type. Reusing fields alone does not justify the relationship.", "对象模型应定义构造器、职责和有效状态转移。使用继承时，应检查子类型能否遵守基类型约定。只是复用字段，不足以证明继承关系合理。"],
      ]),
      section(["Plan failure as well as success", "同时规划成功与失败"], [
        ["File operations can fail because a file is missing, a record is malformed, or a resource is unavailable. Catch exceptions where the program can take a meaningful action. Silently discarding an error may produce a plausible but incorrect result.", "文件可能因不存在、记录格式错误或资源不可用而操作失败。应在程序能够采取有效措施的位置处理异常。悄悄忽略错误，可能产生看似合理却错误的结果。"],
        ["The Python example computes a mean and deliberately rejects an empty sequence. It demonstrates a practical-language solution, not a program for the pseudocode editor. Extend its tests with one value, repeated values, and negative values before using it in a larger program.", "Python 示例计算平均值，并明确拒绝空序列。它演示实际语言的实现，不是给伪代码编辑器运行的程序。用于更大程序之前，应添加单值、重复值和负值等测试。"],
      ], `def mean(values):
    if not values:
        raise ValueError("At least one value is required")
    return sum(values) / len(values)

print(mean([2, 4, 6]))`, "python"),
    ], ["Why is returning 0 for every file-reading error a weak recovery strategy?", "为什么所有文件读取错误都返回 0，不是合适的恢复策略？"], ["It can make failure look like a legitimate result. Report the error or use an explicitly defined recovery path.", "这样会把失败伪装成正常结果。应报告错误，或使用明确定义的恢复流程。"]),
];
