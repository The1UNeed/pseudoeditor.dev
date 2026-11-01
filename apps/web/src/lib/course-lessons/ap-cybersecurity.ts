import { lesson, section, type Lesson } from "./types";

export const apCybersecurity: Lesson[] = [
  lesson("security-and-social-engineering", ["Recognize risk and social engineering", "识别风险与社会工程"],
    ["Separate assets, threats, vulnerabilities, and controls in an everyday login scenario.", "在登录情境中区分资产、威胁、漏洞和控制措施。"], ["Introduction to security", "安全入门"], [
      section(["Describe the risk precisely", "准确描述风险"], [
        ["An asset is something worth protecting, such as an account or a customer database. A threat is a possible cause of harm. A vulnerability is a weakness that can be exploited. Risk depends on both the likelihood of harm and its impact; a vulnerability list alone is not a risk assessment.", "资产是值得保护的对象，例如账号或客户数据库。威胁是可能造成损害的因素，漏洞是可被利用的弱点。风险取决于损害发生的可能性和影响程度，漏洞清单并不等于风险评估。"],
        ["A forged password-reset message targets a person's trust rather than breaking encryption. Check the real destination and use a known route to the service instead of the supplied link. AI-generated text or a convincing voice is not proof of identity.", "伪造的重置密码消息利用人的信任，而不是破解加密。应核实实际目标地址，并通过已知渠道进入服务。AI 生成的文字或逼真的声音不能证明身份。"],
      ]),
      section(["Choose layers of protection", "选择多层保护"], [
        ["For a stolen password, multifactor authentication can reduce account takeover risk, while login alerts help detect misuse. A public Wi-Fi network also changes what you trust: check the network, use encrypted services, and avoid accepting unexpected certificate warnings.", "密码泄露时，多因素认证可以降低账号被接管的风险，登录警报则帮助发现滥用。公共 Wi-Fi 也会改变信任边界：核实网络、使用加密服务，并警惕意外的证书警告。"],
        ["Explain what each control prevents or detects, and what risk remains. In a tabletop exercise, record the asset, threat, weakness, proposed control, and evidence that would show an attack. Use fictional accounts and authorized training environments.", "说明每项措施预防或检测什么，以及还有哪些残余风险。桌面演练中记录资产、威胁、弱点、控制措施和攻击证据，使用虚构账号和获准的训练环境。"],
      ]),
    ], ["Is a login alert preventive or detective?", "登录警报属于预防性还是检测性控制？"], ["Detective. It reports suspicious activity; it does not itself stop someone from signing in.", "属于检测性控制。它报告可疑活动，本身并不阻止登录。"]),
  lesson("securing-spaces", ["Protect a physical space", "保护物理空间"],
    ["Map physical access, environmental risks, and evidence of intrusion.", "分析物理访问、环境风险与入侵证据。"], ["Securing spaces", "保护空间"], [
      section(["Trace a path to the asset", "追踪通向资产的路径"], [
        ["A locked server rack is useful, but an unlocked room may still expose network sockets, backup media, or power controls. Walk through who can reach each asset and whether a visitor can follow an employee through a controlled door. This is tailgating.", "服务器机柜上锁虽有用，但未锁的房间仍可能暴露网络接口、备份介质或电源控制。检查谁能接近每项资产，以及访客能否尾随员工进入受控门禁区，这称为尾随进入。"],
        ["Threats also include fire, water, heat, and loss of power. Confidentiality is not the only goal: keeping a service available may require cooling, protected power, and recovery arrangements.", "威胁还包括火灾、进水、过热和断电。保密不是唯一目标：保持服务可用还需要散热、供电保护和恢复安排。"],
      ], undefined, undefined, { kind: "flow", nodes: [{ label: "Building access" }, { label: "Room access" }, { label: "Rack access" }, { label: "Device access" }] }),
      section(["Combine prevention and detection", "结合预防与检测"], [
        ["Badge access and visitor procedures restrict entry. Door alarms, access logs, and cameras can help reveal a violation. Place a control where it addresses the actual weakness, and consider privacy, cost, and emergency access.", "门禁卡和访客流程限制进入；门报警、访问日志和摄像头帮助发现违规。措施应针对实际弱点，同时考虑隐私、成本和紧急通行。"],
        ["Compare badge records with the timing of an incident. A door-open alert supports an investigation but does not identify the intruder by itself. Preserve the original evidence and record who examined it.", "将门禁记录与事件时间对照。门未关警报可用于调查，但不能独立证明入侵者身份。保留原始证据并记录检查人员。"],
      ]),
    ], ["Why is a camera alone insufficient to secure a server room?", "为什么只安装摄像头不足以保护服务器房间？"], ["It can record an entry but may not prevent it. Use access controls as well as monitoring and a response process.", "摄像头能记录进入行为，却不一定能阻止进入。需要同时采用访问控制、监控和响应流程。"]),
  lesson("securing-networks", ["Segment and monitor a network", "分段并监控网络"],
    ["Use network zones, firewall rules, and traffic evidence to limit exposure.", "使用网络区域、防火墙规则和流量证据减少暴露面。"], ["Securing networks", "保护网络"], [
      section(["Define the permitted connections", "定义允许的连接"], [
        ["A guest device should not have the same access as a staff workstation. Segmentation creates network zones so an incident in one zone has fewer paths to other assets. Write down the connections each service actually needs before choosing firewall rules.", "访客设备不应拥有与员工工作站相同的访问权限。网络分段建立不同区域，减少某一区域事件传播到其他资产的路径。制定防火墙规则前，先列出服务实际需要的连接。"],
        ["A rule can examine source, destination, protocol, and port. Allowing an application to receive encrypted web traffic does not justify allowing every inbound connection. Test allowed traffic and blocked traffic after a rule change.", "规则可以检查来源、目的地、协议和端口。允许应用接收加密网页流量，不代表应允许所有入站连接。修改规则后应同时测试允许和阻止的流量。"],
      ], undefined, undefined, { kind: "table", columns: ["Source", "Destination", "Decision"], rows: [["Guest zone", "Public internet", "Allow approved services"], ["Guest zone", "Staff database", "Deny"], ["Application", "Database", "Allow required connection"]] }),
      section(["Interpret evidence in context", "结合背景解释证据"], [
        ["Repeated connection attempts to many ports may justify investigation. Compare the traffic with the normal pattern and with authorized maintenance. One unusual record is evidence to examine, not a complete explanation of an incident.", "对多个端口的反复连接尝试可能需要调查。应与正常模式及获准的维护活动比较。一条异常记录是待分析的证据，不是事件的完整解释。"],
        ["Wireless protection also needs secure authentication, maintained access points, and separation of guest access. An encrypted wireless link does not make a compromised device trustworthy.", "无线网络还需要安全认证、持续维护接入点并隔离访客访问。无线链路已加密，并不表示受入侵的设备值得信任。"],
      ]),
    ], ["Does segmentation guarantee that an attack cannot spread?", "网络分段能保证攻击无法传播吗？"], ["No. It restricts paths, but allowed connections and misconfigured controls can still provide routes. Test the boundaries.", "不能。它限制传播路径，但允许的连接或错误配置仍可能提供通路。需要测试区域边界。"]),
  lesson("securing-devices", ["Harden a device and investigate alerts", "加固设备并调查警报"],
    ["Connect patching, authentication, least privilege, and endpoint logs.", "把补丁、认证、最小权限和终端日志联系起来。"], ["Securing devices", "保护设备"], [
      section(["Reduce what can go wrong", "减少可被利用的弱点"], [
        ["Remove unused services, apply tested security updates, and use an account with only the permissions needed for the task. Authentication checks who is requesting access. Authorization checks what that identity may do. A successful login does not grant every permission.", "移除未使用的服务、部署经过测试的安全更新，并使用只具备任务所需权限的账号。认证检查身份，授权检查该身份允许执行哪些操作。成功登录不代表拥有全部权限。"],
        ["Multifactor authentication combines different factor types, such as a password and a hardware token. Two passwords are still one factor type. Account recovery must also be protected or it can undermine the normal login controls.", "多因素认证结合不同类型的因素，例如密码和硬件令牌。两个密码仍然属于同一种因素。账号恢复流程也必须受到保护，否则可能削弱常规登录控制。"],
      ]),
      section(["Build a defensible timeline", "建立有证据支持的时间线"], [
        ["Compare login events, newly started processes, and file changes. Record timestamps and time zones. Multiple failed logins followed by a success deserve investigation, but check whether an authorized user simply corrected a password.", "对照登录事件、新启动进程和文件变化，记录时间戳及其时区。多次失败后成功登录值得调查，但也应核实是否只是合法用户改正了密码。"],
        ["When an incident is suspected, follow the organization's response procedure. Preserve useful logs, document actions, and isolate a device only within your authority. An alert is the start of analysis, not automatic proof that a specific person attacked the system.", "怀疑发生事件时，遵循组织响应流程。保留日志、记录行动，并只在授权范围内隔离设备。警报是分析的起点，不能自动证明某个人发动了攻击。"],
      ]),
    ], ["A signed-in user can read another team's confidential folder. Which control failed?", "已登录用户能读取另一团队的保密文件，哪项控制出现问题？"], ["Authorization. The identity may be valid, but its permitted access is too broad.", "是授权。身份可能有效，但被授予的访问范围过大。"]),
  lesson("securing-applications-and-data", ["Protect applications and data", "保护应用与数据"],
    ["Distinguish encryption, hashing, access controls, and application security.", "区分加密、哈希、访问控制和应用安全。"], ["Securing applications and data", "保护应用与数据"], [
      section(["Use the right cryptographic tool", "选择正确的密码学工具"], [
        ["Symmetric encryption uses a shared secret key. Asymmetric cryptography uses a related public and private key pair. Encryption is reversible with the appropriate key; a cryptographic hash is designed as a one-way digest. A hash by itself does not hide a predictable value from guessing.", "对称加密使用共享密钥，非对称密码学使用相关的公钥与私钥。加密可用相应密钥还原，密码学哈希则设计为单向摘要。单独使用哈希不能阻止对可预测值进行猜测。"],
        ["Protect the keys as well as the encrypted files. Backups support availability, but must also be access-controlled and tested by restoring data. Copying a corrupted database creates another corrupted copy rather than proving recovery.", "保护加密文件的同时也要保护密钥。备份支持可用性，但也必须控制访问并通过恢复验证。复制损坏的数据库，只会得到另一个损坏副本。"],
      ]),
      section(["Enforce rules at the application boundary", "在应用边界执行规则"], [
        ["Validate expected input and use parameterized database operations so input is treated as data. Check authorization on the server for every protected operation; hiding a button is not an access-control check.", "验证输入格式，并使用参数化数据库操作，让输入被当作数据处理。每个受保护操作都应在服务器检查授权；隐藏按钮并不等于访问控制。"],
        ["Use fictional audit records to identify repeated access denials, unusual exports, or unexpected configuration changes. Explain which records support the conclusion and which additional evidence would distinguish an attack from an authorized action.", "使用虚构审计记录识别反复被拒的访问、异常导出或意外配置修改。说明哪些记录支持结论，以及还需要哪些证据来区分攻击和合法操作。"],
      ]),
    ], ["Can encryption replace access control?", "加密可以替代访问控制吗？"], ["No. Someone with authorized decryption access can still misuse data. Decide who may access it and monitor sensitive actions.", "不能。具备解密权限的人仍可能滥用数据。需要明确谁能访问，并监控敏感操作。"]),
];
