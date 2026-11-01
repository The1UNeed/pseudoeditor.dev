import { lesson, section, type Lesson } from "./types";

export const apCsp: Lesson[] = [
  lesson("creative-development", ["Design a program for a user", "为用户设计程序"],
    ["Turn a user's need into a purpose, a design, and testable behavior.", "把用户需求转化为程序目的、设计和可测试的行为。"], ["Creative development", "创意开发"], [
      section(["Begin with a specific need", "从具体需求开始"], [
        ["A club organizer needs to know whether enough members can attend an event. The program's purpose is to help choose a date. Its function is to count the available members for each proposed date. Purpose explains why the program exists; function explains what it does.", "社团组织者需要知道有多少成员能参加活动。程序的目的是帮助选日期，功能是统计每个候选日期能出席的人数。目的解释为什么需要程序，功能解释程序做什么。"],
        ["Sketch the input, processing, and output before coding. Agree on what happens when nobody replies, when someone replies twice, or when two dates tie. These decisions become test cases rather than surprises at the end.", "编码前先画出输入、处理和输出。约定无人回复、重复回复或两个日期人数相同时如何处理。这些约定应成为测试用例，而不是最后才发现的问题。"],
      ], undefined, undefined, { kind: "flow", nodes: [{ label: "User need" }, { label: "Design" }, { label: "Prototype" }, { label: "Feedback" }] }),
      section(["Iterate and explain decisions", "迭代并解释设计决定"], [
        ["Build a small version, ask someone to use it, and observe where they struggle. Separate a syntax error, which prevents code being understood, from a logic error, which produces the wrong result. Test normal, boundary, and unusual inputs after each change.", "先实现一个小版本，邀请用户试用并观察困难。语法错误使代码无法被理解，逻辑错误则产生错误结果。每次修改后都测试正常、边界和特殊输入。"],
        ["When collaborating, divide tasks and review each other's changes. Record the reason for a design choice and acknowledge code or media from other people. A working program alone does not explain how you developed it.", "协作时分配任务并互相审查修改。记录设计选择的理由，注明他人的代码或素材。只有能运行的程序，还不足以说明开发过程。"],
      ]),
    ], ["The counter runs but counts a duplicate reply twice. What kind of error is this?", "计数器能运行，却把重复回复计算了两次。这是什么错误？"], ["A logic error. Add a test with the same member replying twice and define which reply should count.", "这是逻辑错误。添加同一个成员回复两次的测试，并明确应计算哪一次回复。"]),
  lesson("data-and-abstraction", ["Represent and investigate data", "表示并分析数据"],
    ["Use binary, compression, metadata, and data cleaning without losing the meaning of a dataset.", "理解二进制、压缩、元数据和数据清洗，同时保留数据的含义。"], ["Data", "数据"], [
      section(["Bits represent a choice", "比特表示一种选择"], [
        ["One bit has two possible values. Eight bits can represent 256 different patterns. The pattern 01000001 means 65 as an unsigned integer, but can mean a letter under a character encoding. The bits do not carry their interpretation with them.", "一比特有两种取值，八比特可表示 256 种模式。01000001 作为无符号整数表示 65，在字符编码中则可以表示一个字母。比特本身并不包含解释方式。"],
        ["Lossless compression permits exact reconstruction, which matters for program files. Lossy compression removes information to save space, which may be acceptable for a photo. A smaller file is not automatically a more accurate file.", "无损压缩能精确还原内容，适合程序文件。有损压缩通过丢弃信息节省空间，对照片可能可以接受。文件更小，并不代表内容更准确。"],
      ], undefined, undefined, { kind: "binary", value: 65, bits: 8, showHex: true }),
      section(["Ask what the dataset omits", "检查数据集遗漏了什么"], [
        ["Before averaging journey times, check whether times are recorded in seconds or minutes, remove impossible entries, and decide how to treat missing values. Metadata describes details such as units, collection date, and the meaning of a column.", "计算平均行程时间前，先确认单位是秒还是分钟，检查不可能的值，并决定如何处理缺失值。元数据说明单位、采集日期和列的含义等信息。"],
        ["A pattern in a dataset can suggest a question, but correlation alone does not establish a cause. If only students with smartphones supplied journey data, the results may not describe every student at the school.", "数据中的规律可以引出问题，但相关性本身不能证明因果关系。如果只有使用智能手机的学生提供数据，结果可能无法代表全校学生。"],
      ]),
    ], ["Would lossy compression be appropriate for a file of program instructions?", "程序指令文件适合使用有损压缩吗？"], ["No. Removing or changing even one instruction could change the program. Use lossless compression when exact recovery matters.", "不适合。丢失或改变一条指令都可能改变程序。需要精确恢复时应使用无损压缩。"]),
  lesson("algorithms-and-lists", ["Trace AP algorithms and lists", "追踪 AP 算法与列表"],
    ["Read AP assignment, selection, repetition, and one-based list notation.", "阅读 AP 的赋值、选择、重复和从 1 开始的列表记法。"], ["Algorithms and programming", "算法与编程"], [
      section(["Read assignment in order", "按顺序理解赋值"], [
        ["An assignment evaluates the right-hand expression before replacing the value on the left. Equality compares values; it does not update them. Track each variable after every statement, especially when one variable depends on another.", "赋值先计算右侧表达式，再替换左侧变量的值。相等比较不会更新变量。每执行一条语句都记录变量，尤其要注意变量之间的依赖。"],
        ["AP reference lists start at index 1. In this example, the list stores three marks and FOR EACH visits each mark once. Selection decides whether a mark increases the count. The final displayed count is 2.", "AP 参考记法的列表索引从 1 开始。示例存储三个分数，FOR EACH 各访问一次，选择结构判断是否增加计数，最后显示 2。"],
      ], `marks ← [42, 65, 80]
passes ← 0
FOR EACH mark IN marks
{
  IF (mark ≥ 50)
  {
    passes ← passes + 1
  }
}
DISPLAY(passes)`, "ap-pseudocode"),
      section(["Choose the right algorithm", "选择合适的算法"], [
        ["A linear search checks elements one at a time and works on an unsorted list. Binary search discards half the remaining search range at each step, but requires a sorted list. An algorithm can be correct and still take too long for a very large input.", "线性搜索逐项检查，可用于未排序列表。二分搜索每次排除一半候选范围，但要求列表已经排序。算法即使正确，也可能无法在大规模输入上及时完成。"],
        ["To evaluate a loop, test an empty list, a list of one item, and a list with repeated items. Decide whether the question asks for the first match, every match, a count, or a Boolean result before writing the algorithm.", "测试循环时，应考虑空列表、单元素列表和含重复元素的列表。编写算法前先明确需要第一个匹配、所有匹配、计数还是布尔结果。"],
      ]),
    ], ["What is the index of 65 in the AP list [42, 65, 80]?", "AP 列表 [42, 65, 80] 中，65 的索引是多少？"], ["2. AP reference notation uses one-based list indexing.", "是 2。AP 参考记法中的列表索引从 1 开始。"]),
  lesson("procedures-and-create", ["Build an abstraction and explain it", "构建并解释抽象"],
    ["Use parameters, return values, and a list to express a reusable algorithm.", "使用参数、返回值和列表表达可复用的算法。"], ["Algorithms and programming", "算法与编程"], [
      section(["Give a procedure one clear job", "让过程承担一个明确任务"], [
        ["A parameter supplies information to a procedure. A return value supplies information back to the caller. CountAtLeast works for different lists and thresholds, so its caller can ask a question without repeating the loop.", "参数向过程提供信息，返回值把信息传回调用方。CountAtLeast 可接受不同的列表和阈值，让调用方无需重复循环就能提出不同的问题。"],
        ["The list groups an arbitrary number of scores under one name. Without it, adding another score could require another variable and another copy of the condition. This is the complexity that the data abstraction manages.", "列表把任意数量的分数组织在同一个名称下。不使用列表时，增加一个分数可能需要增加变量并复制条件语句。数据抽象管理的正是这种复杂性。"],
      ], `PROCEDURE CountAtLeast(scores, threshold)
{
  count ← 0
  FOR EACH score IN scores
  {
    IF (score ≥ threshold)
    {
      count ← count + 1
    }
  }
  RETURN(count)
}
DISPLAY(CountAtLeast([42, 65, 80], 70))`, "ap-pseudocode"),
      section(["Explain development with evidence", "用证据解释开发过程"], [
        ["For your own project, describe the input, the result, and how the algorithm reaches it. Explain how changing a parameter changes the result. Choose tests that distinguish correct behavior from a plausible mistake, such as using > when the requirement says at least.", "在自己的项目中说明输入、结果和算法如何得到结果。解释参数改变后结果如何变化。测试应能区分正确实现与常见错误，例如需求是“至少”，代码却使用 >。"],
        ["Use the current official Create task instructions to check submission requirements. This example is for learning procedure design; develop and explain your own solution for assessed work.", "提交要求应以当前官方 Create 任务说明为准。本示例用于学习过程设计；评估作品需要你开发并解释自己的解决方案。"],
      ]),
    ], ["What does CountAtLeast([42, 65, 80], 70) return?", "CountAtLeast([42, 65, 80], 70) 返回什么？"], ["1. Only 80 is at least 70. With a threshold of 65, it returns 2.", "返回 1，只有 80 不小于 70。阈值改为 65 时返回 2。"]),
  lesson("internet-and-computing", ["Connect computers and share work", "连接计算机并分配工作"],
    ["Distinguish packets, routing, fault tolerance, and parallel processing.", "区分数据包、路由、容错和并行处理。"], ["Computer systems and networks", "计算机系统与网络"], [
      section(["A message crosses many networks", "消息经过多个网络"], [
        ["The internet is a network of networks. Devices use agreed protocols so machines made by different organizations can communicate. A message can be split into packets that travel through routers and are reconstructed at the destination.", "互联网是网络组成的网络。设备遵守共同协议，使不同组织生产的机器能够通信。消息可以分成数据包，经路由器转发，在目的地重新组装。"],
        ["DNS associates a domain name with address information. Routing chooses where to send a packet next. Redundant connections provide alternative paths when one connection fails, but they do not guarantee that every service remains available.", "DNS 把域名与地址信息关联起来，路由决定数据包的下一跳。冗余连接能在链路故障时提供备用路径，但不能保证所有服务始终可用。"],
      ], undefined, undefined, { kind: "flow", nodes: [{ label: "Sender" }, { label: "Router" }, { label: "Router" }, { label: "Receiver" }] }),
      section(["Parallel work has limits", "并行工作的限制"], [
        ["If four independent jobs each take two minutes, one processor takes eight minutes and four processors could finish in two minutes before overhead. If one job must wait for the result of another, that dependency limits the speedup.", "四项独立任务各需两分钟，单处理器需八分钟，四个处理器忽略开销时可在两分钟内完成。如果一项任务必须等待另一项的结果，这种依赖就会限制加速效果。"],
        ["Distributed computing uses multiple networked computers. Communication and coordination have a cost. Compare the whole execution time, including the sequential part, rather than assuming that twice as many processors makes every program twice as fast.", "分布式计算使用多台联网计算机，通信与协调都有成本。比较时间时要包含串行部分，不能假设处理器数量翻倍就一定能把时间减半。"],
      ]),
    ], ["Why can an additional network path improve fault tolerance?", "为什么增加网络路径可以提高容错性？"], ["A packet may have another route when a connection fails. The alternative must still connect the required devices.", "当某条连接故障时，数据包可能还有其他可用路由，但备用路径仍必须连接所需设备。"]),
  lesson("impact-of-computing", ["Evaluate a computing innovation", "评价计算创新"],
    ["Identify stakeholders, bias, privacy risks, and unequal access using a concrete scenario.", "通过具体情境识别利益相关者、偏差、隐私风险和访问差异。"], ["Impact of computing", "计算的影响"], [
      section(["Benefits and harms can coexist", "益处和危害可以同时存在"], [
        ["A navigation app may save drivers time while sending more traffic through residential streets. Identify who benefits, who bears a cost, and what evidence supports each claim. A consequence may be unintended even when the program works as designed.", "导航应用可能节省驾驶者的时间，却把更多车辆引入住宅街道。指出谁受益、谁承担成本，以及每个结论的证据。程序即使按设计运行，也可能造成意外后果。"],
        ["Bias can enter through the collected data, the way a problem is defined, or a developer's choices. If a speech system is tested on only one accent, an overall accuracy figure may hide poor performance for other speakers.", "偏差可能来自采集的数据、问题定义方式或开发者的选择。如果语音系统只用一种口音测试，整体准确率可能掩盖它对其他使用者的较差表现。"],
      ]),
      section(["Limit data and widen access", "减少数据收集并扩大可及性"], [
        ["Collect only the personal data the task requires and explain who can access it. Encryption protects data in transit or storage, but does not decide whether an organization should have collected it in the first place.", "只收集完成任务所需的个人数据，并说明谁能访问。加密可以保护传输或存储中的数据，却不能回答组织是否应该收集这些数据。"],
        ["The digital divide includes differences in connectivity, affordability, accessibility, and skills. An online-only service can exclude people without reliable access. Evaluate an offline alternative or accessible interface as part of the solution, not as an afterthought.", "数字鸿沟包括网络、费用、无障碍使用和技能方面的差异。仅提供在线服务可能排除无法稳定联网的人。设计时就应考虑离线渠道和无障碍界面。"],
      ]),
    ], ["Does encrypting location data remove every privacy concern?", "加密位置数据能消除所有隐私问题吗？"], ["No. Collection, retention, access, and use still matter, even when the storage and connection are encrypted.", "不能。即使存储和连接已加密，收集范围、保留时间、访问权限和使用方式仍然重要。"]),
];
