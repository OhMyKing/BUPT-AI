\NeedsTeXFormat{LaTeX2e}[2005/12/01]
\ProvidesClass{BUPTthesis}
[2018/12/12 v7.0 BUPT graduate thesis LaTeX2e class]
\RequirePackage{etoolbox}
\RequirePackage{kvoptions}
\RequirePackage{ifthen}
\RequirePackage{ulem}
\SetupKeyvalOptions{family=bupt,prefix=bupt@,setkeys=\kvsetkeys}
\newcommand{\ekv}[1]{\kvsetkeys{bupt}{#1}}
\DeclareStringOption[tx]{mathfont}
\DeclareVoidOption{txmath}{\ekv{mathfont=tx}}
\DeclareVoidOption{xits}{\ekv{mathfont=xits}}
\DeclareBoolOption{review}
\DeclareBoolOption{chapterbib}
\DeclareBoolOption{gls}
\DeclareBoolOption{noboldheiti}
\ProcessKeyvalOptions*

\newtoggle{gls}
\ifthenelse{\boolean{bupt@gls}}{\toggletrue{gls}}{}
\newtoggle{review}
\ifthenelse{\boolean{bupt@review}}{\toggletrue{review}}{}
\newtoggle{chapterbib}
\ifthenelse{\boolean{bupt@chapterbib}}{\toggletrue{chapterbib}}{}
\newtoggle{noboldheiti}
\ifthenelse{\boolean{bupt@noboldheiti}}{\toggletrue{noboldheiti}}{}

\iftoggle{noboldheiti}
{%
\newcommand{\bheiti}[1]{#1}
}
{%
\newcommand{\bheiti}[1]{\CJKfakebold{#1}}
}

% config ctex
\LoadClass[a4paper,oneside,UTF8,zihao=-4,scheme=chinese,linespread=1.5]{ctexbook}
\ctexset{%
  listfigurename = \bupt@listfigurename,
  listtablename  = \bupt@listtablename,
  part/pagestyle = empty,
  chapter/tocline = \CTEXifname{\protect\numberline{\heiti\CTEXthechapter\hspace{.3em}}}{}\heiti#2,
  chapter = {%
    format = \zihao{3}\heiti\centering\bfseries\bheiti,
    pagestyle = main,
    beforeskip = 0pt,
    afterskip = 40pt,
  },
  section/format = \zihao{4}\heiti\bfseries\bheiti,
  subsection/format = \indent\zihao{-4}\heiti\bfseries\bheiti,
  subsubsection/format = \indent\zihao{-4}\heiti\bfseries\bheiti,
  appendix/number = \arabic{chapter},
}
\newcommand{\refname}{\bibname}
\RequirePackage{xeCJKfntef}
% \AtEndOfClass{\input{BUPTthesis.cfg}}

% define names
\newcommand{\studentid}[1]{\def\bupt@meta@studentid{#1}}
\newcommand{\classid}[1]{\def\bupt@meta@classid{#1}}
\newcommand{\ctitle}[1]{\def\bupt@meta@ctitle{#1}}
\newcommand{\etitle}[1]{\def\bupt@meta@etitle{#1}}
\newcommand{\cdegree}[1]{\def\bupt@meta@cdegree{#1}}
\newcommand{\cdepartment}[1]{\def\bupt@meta@cdepartment{#1}}
\newcommand{\edepartment}[1]{\def\bupt@meta@edepartment{#1}}
\newcommand{\cmajor}[1]{\def\bupt@meta@cmajor{#1}}
\newcommand{\emajor}[1]{\def\bupt@meta@emajor{#1}}
\newcommand{\cauthor}[1]{\def\bupt@meta@cauthor{#1}}
\newcommand{\eauthor}[1]{\def\bupt@meta@eauthor{#1}}
\newcommand{\csupervisor}[1]{\def\bupt@meta@csupervisor{#1}}
\newcommand{\esupervisor}[1]{\def\bupt@meta@esupervisor{#1}}
\newcommand{\ckeywords}[1]{\def\bupt@meta@ckeywords{#1}}
\newcommand{\ekeywords}[1]{\def\bupt@meta@ekeywords{#1}}
\newcommand{\cdate}[1]{\def\bupt@meta@cdate{#1}}
\newcommand{\edate}[1]{\def\bupt@meta@edate{#1}}


% Load packages
\RequirePackage{amsthm,thmtools}
\RequirePackage{mathtools,amsfonts,amssymb,empheq}
\ifthenelse{\equal{\bupt@mathfont}{tx}}{
\RequirePackage{newtxtext}
  \RequirePackage[smallerops]{newtxmath}
  \RequirePackage[scr=euler]{mathalpha}
}{}
\RequirePackage{graphicx}
\RequirePackage[per-mode=repeated-symbol]{siunitx}
\RequirePackage{longtable}
\RequirePackage{booktabs}
\RequirePackage{tabu}
\RequirePackage{emptypage}
\ifthenelse{\equal{\bupt@mathfont}{xits}}{
  \RequirePackage{fontspec}
  \setmainfont{Times New Roman}
  \RequirePackage{unicode-math}
  \setmathfont{XITS Math}
  \setmathfont[range={cal,bfcal},StylisticSet=1]{XITS Math}
}{}


%caption
\RequirePackage{caption}
\RequirePackage{subcaption}
\RequirePackage{floatrow}
\DeclareCaptionFont{kaiti}{\zihao{5}\kaishu}
\captionsetup[figure]{
  labelsep=quad,
  font=kaiti,
}
\captionsetup[table]{
  labelsep=quad,
  font=kaiti
}
\floatsetup[table]{capposition=top}
\captionsetup[subfigure]{
  justification=raggedright,
  labelformat=simple,
  list=off,
  font=kaiti,
}
\floatsetup[subfigure]{
  style=plain,
  heightadjust=object,
  capbesideposition={left,top},
  capbesidesep=none,
}
\renewcommand\thesubfigure{(\alph{subfigure})}

% biblatex
\iftoggle{chapterbib}{\PassOptionsToPackage{refsection=chapter}{biblatex}}{}
\RequirePackage[
  backend=biber,
  style=gb7714-2015,
  gbnamefmt=familyahead,
  gbpub=false,
  gbpunctin=false,
  doi=false,
  url=false,
  eprint=false,
]{biblatex}
\AtNextBibliography{\small}
\iftoggle{chapterbib}
{%
  \newcommand{\chapterbib}{\printbibliography[heading=subbibintoc]}
  \newcommand{\mainbib}{\relax}
}
{%
  \newcommand{\chapterbib}{\relax}
  \newcommand{\mainbib}{\printbibliography[heading=bibintoc,title={\heiti\bupt@label@refname}]}
}
\iftoggle{review}{%
\newcommand{\pubcite}[1]{\AtNextCitekey{\clearname{author}}\fullcite{#1}}
}{%
\newcommand{\pubcite}[1]{\AtNextCite{\defcounter{maxnames}{99}}\fullcite{#1}}
}

% hyperref
\AtBeginDocument{
	\hypersetup{
    bookmarksnumbered,
		colorlinks,
		urlcolor=black,
		linkcolor=black,
		citecolor=black,
		pdfauthor={\bupt@meta@cauthor},
		pdftitle={\bupt@meta@ctitle},
	}
}
\RequirePackage{hyperref}

% theorem like style

\declaretheoremstyle[
  style=definition,
  headpunct={},
  postheadspace={.5\ccwd},
  headindent={\parindent},
  numberwithin=chapter,
]{Theorem}

\declaretheorem[name={假设},style=Theorem]{assumption}
\declaretheorem[name={定义},style=Theorem]{definition}
\declaretheorem[name={命题},style=Theorem]{proposition}
\declaretheorem[name={引理},style=Theorem]{lemma}
\declaretheorem[name={定理},style=Theorem]{theorem}
\declaretheorem[name={公理},style=Theorem]{axiom}
\declaretheorem[name={推论},style=Theorem]{corollary}
\declaretheorem[name={注释},style=Theorem]{remark}
\declaretheorem[name={问题},style=Theorem]{problem}
\declaretheorem[name={猜想},style=Theorem]{conjecture}
\declaretheorem[name={例},style=Theorem]{example}

\declaretheoremstyle[
  style=definition,
  numbered=no,
  headindent={\parindent},
  headpunct={：},
  qed=\qedsymbol
]{Proof}

\declaretheorem[name={证明},style=Proof]{Proof}
\renewenvironment{proof}{\begin{Proof}}{\end{Proof}}

% algorithm
\RequirePackage{algorithm, algpseudocode}
\floatname{algorithm}{算法}

% cleveref
\RequirePackage[sort]{cleveref}

\newcommand{\creflastconjunction}{~和~}
\newcommand{\crefpairconjunction}{~和~}

\crefformat{chapter}{第#2#1#3章}
\crefrangeformat{chapter}{第~#3#1#4~-~#5#2#6~章}

\crefformat{section}{第~#2#1#3~节}
\crefrangeformat{section}{第~#3#1#4~-~#5#2#6~节}

\crefformat{subsection}{第~#2#1#3~小节}
\crefrangeformat{subsection}{第~#3#1#4~-~#5#2#6~小节}

\crefformat{subsubsection}{第~#2#1#3~项}
\crefrangeformat{subsubsection}{第~#3#1#4~-~#5#2#6~项}

\crefname{table}{表}{表}
\creflabelformat{table}{#2#1#3~}
\crefrangelabelformat{table}{#3#1#4~-~#5#2#6~}

\crefname{figure}{图}{图}
\creflabelformat{figure}{#2#1#3~}
\crefrangelabelformat{figure}{#3#1#4~-~#5#2#6~}

\crefname{equation}{}{}
\creflabelformat{equation}{(#2#1#3)}
\crefrangelabelformat{equation}{(#3#1#4)~-~(#5#2#6)}

\crefname{assumption}{假设}{假设}
\creflabelformat{assumption}{#2#1#3~}
\crefrangelabelformat{assumption}{#3#1#4~-~#5#2#6~}

\crefname{definition}{定义}{定义}
\creflabelformat{definition}{#2#1#3~}
\crefrangelabelformat{definition}{#3#1#4~-~#5#2#6~}

\crefname{proposition}{命题}{命题}
\creflabelformat{proposition}{#2#1#3~}
\crefrangelabelformat{proposition}{#3#1#4~-~#5#2#6~}

\crefname{lemma}{引理}{引理}
\creflabelformat{lemma}{#2#1#3~}
\crefrangelabelformat{lemma}{#3#1#4~-~#5#2#6~}

\crefname{theorem}{定理}{定理}
\creflabelformat{theorem}{#2#1#3~}
\crefrangelabelformat{theorem}{#3#1#4~-~#5#2#6~}

\crefname{axiom}{公理}{公理}
\creflabelformat{axiom}{#2#1#3~}
\crefrangelabelformat{axiom}{#3#1#4~-~#5#2#6~}

\crefname{corollary}{推论}{推论}
\creflabelformat{corollary}{#2#1#3~}
\crefrangelabelformat{corollary}{#3#1#4~-~#5#2#6~}

\crefname{remark}{注释}{注释}
\creflabelformat{remark}{#2#1#3~}
\crefrangelabelformat{remark}{#3#1#4~-~#5#2#6~}

\crefname{problem}{问题}{问题}
\creflabelformat{problem}{#2#1#3~}
\crefrangelabelformat{problem}{#3#1#4~-~#5#2#6~}

\crefname{conjecture}{猜想}{猜想}
\creflabelformat{conjecture}{#2#1#3~}
\crefrangelabelformat{conjecture}{#3#1#4~-~#5#2#6~}

\crefname{example}{例}{例}
\creflabelformat{example}{#2#1#3~}
\crefrangelabelformat{example}{#3#1#4~-~#5#2#6~}

\crefname{algorithm}{算法}{算法}
\creflabelformat{algorithm}{#2#1#3~}
\crefrangelabelformat{algorithm}{#3#1#4~-~#5#2#6~}

\crefname{appendix}{附录}{附录}
\creflabelformat{appendix}{#2#1#3~}
\crefrangelabelformat{appendix}{#3#1#4~-~#5#2#6~}

% glossaries
\iftoggle{gls}
{
  \RequirePackage[nomain,nogroupskip,toc=false,section=chapter]{glossaries}[=v4.49]
  \newglossarystyle{bupt@acronyms@style}{  % 设置自定义缩略语表格式
    \setglossarystyle{long}                % 以 long 样式为基础
    \renewcommand*{\glossentry}[2]{%
      \glossentryname{##1} & \glossentrydesc{##1}, \glossentrysymbol{##1}\\
    }
  }
  \setlength{\glsdescwidth}{0.9\linewidth} % 缩略语描述列宽
  \setglossarystyle{bupt@acronyms@style} % 选择自定义的缩略语表样式
  % 设置 acronym 词汇表的标题
  \newglossary[alg]{acronym}{acr}{acn}{\bupt@label@listofacronyms}
  \makeglossaries
  % 重载 \newacronym 命令
  \renewcommand{\newacronym}[4]{%
    \newglossaryentry{#1}{%
      type=\acronymtype,%
      name={#2},%
      description={#3},%
      text={#2},%
      descriptionplural={#3\acrpluralsuffix},%
      first={#2}, %{#3 (#2)},%
      plural={#2\acrpluralsuffix},%
      firstplural={\@glo@descplural\space (\@glo@plural)},%
      symbol={#4}%
    }%
  }
  % 重载 \cs{glsdisplayfirst} 命令
  \renewcommand{\glsdisplayfirst}[4]{{#3} ({#2}, {#1})}
  \renewcommand{\glsdefaulttype}{acronym}
  \renewcommand{\glossarysection}[2][\@gls@title]{\chapter{#2}}
  \newcommand{\tableofacronyms}{\printglossary[type=\acronymtype]}
}{\relax}
% config page
\RequirePackage[
  paper=a4paper,
  margin=25mm,
  head=4.22mm,
  headsep=5.78mm,
  footskip=10mm,
  hcentering
]{geometry}

% config toc lof lot
\RequirePackage[titles]{tocloft}
\tocloftpagestyle{front}
\renewcommand{\cftchapleader}{\cftdotfill{\cftdotsep}}
\renewcommand{\cftchapfont}{\normalfont}
\renewcommand{\cftchappagefont}{\normalfont}
\renewcommand{\cftdot}{$\cdot$}
\renewcommand{\cftdotsep}{1.5}
\setlength{\cftbeforechapskip}{0em}
\setlength{\cftbeforesecskip}{0em}
\setlength{\cftbeforesubsecskip}{0em}
\setcounter{secnumdepth}{3}
\setcounter{tocdepth}{2}
\preto\tableofcontents{\cleardoublepage\pdfbookmark[0]{\contentsname}{toc}}
\preto\listoffigures{\cleardoublepage\pdfbookmark[0]{\listfigurename}{lof}}
\preto\listoftables{\cleardoublepage\pdfbookmark[0]{\listtablename}{lot}}

% define heading
\RequirePackage{fancyhdr}
\fancypagestyle{front}{%
  \fancyhf{}
  \fancyfoot[C]{\zihao{-5}\thepage}
  \renewcommand{\headrulewidth}{0pt}
}
\fancypagestyle{main}{%
  \fancyhf{}
  \fancyfoot[C]{\zihao{-5}\thepage}
  \renewcommand{\headrulewidth}{0pt}
}
\appto\frontmatter{\pagestyle{front}\ctexset{chapter/pagestyle=front}\pagenumbering{Roman}}
\appto\mainmatter{\pagestyle{main}\ctexset{chapter/pagestyle=main}\pagenumbering{arabic}}


% 使用enumitem宏包配制列表环境
% 紧凑间距
\RequirePackage[inline]{enumitem}
\setlist{leftmargin=\parindent, labelwidth=*,noitemsep,itemjoin=\enskip}
\setlist[enumerate]{label={(\arabic*)}}

% config numbering for equation fig table and so on.
\AtBeginDocument{%
  \renewcommand{\theequation}{\thechapter-\arabic{equation}}
  \renewcommand{\thefigure}{\thechapter-\arabic{figure}}
  \renewcommand\p@subfigure{\thefigure}
  \renewcommand{\thetable}{\thechapter-\arabic{table}}
  \renewcommand{\thealgorithm}{\thechapter-\arabic{algorithm}}
}

% enclosed number
\RequirePackage{xunicode-addon}
\newfontfamily\EnclosedNumbers{ipaexm.ttf}
\renewcommand{\thefootnote}{\EnclosedNumbers\textcircled\arabic{footnote}}

% draw front pages
\newtoggle{addcover}
\IfFileExists{bsong.ttf}
{%
  \setCJKfamilyfont{bsong}{bsong.ttf}
  \newcommand*{\bsong}{\CJKfamily{bsong}}
}
{\newcommand*{\bsong}{\songti}}
\IfFileExists{cover.tex}
{%
	\input{cover.tex}
	\renewcommand\maketitle{%
	 \makechinesetitle
  }
  \toggletrue{addcover}
}{}
\IfFileExists{cover.pdf}
{%
	\RequirePackage{pdfpages}
  \renewcommand\maketitle{\includepdf[pages=-]{cover.pdf}}
  \toggletrue{addcover}
}{}
\nottoggle{addcover}{\renewcommand{\maketitle}{\relax}}{}

% 中英文摘要+关键词
\newenvironment{cabstract}
{%
  \pdfbookmark[0]{\bupt@label@cabstract}{abstract}
  \begin{center}
    {\zihao{-3}\CJKfakebold{\heiti\bupt@label@cabstract}}
  \end{center}
  \markboth{\bupt@label@cabstract}{}
  \zihao{-4}
  \par
}
{
  \par
	\vspace{20pt}
	\noindent
	{\zihao{-4} {\CJKfakebold{\heiti\bupt@label@ckeywords}} {\bupt@meta@ckeywords}}
}

\newenvironment{eabstract}
{%
	\cleardoublepage
  \pdfbookmark[0]{\bupt@label@eabstract}{ebstract}
  \begin{center}
    \begin{minipage}{120mm}
      \centering
      {\zihao{3}\bfseries\bupt@meta@etitle}
      \vskip 20pt
      {\zihao{-3}\bfseries\bupt@label@eabstract}
    \end{minipage}
  \end{center}
  \markboth{\bupt@label@eabstract}{}
  \vskip 20pt
  \zihao{-4}
  \par
}
{
  \par
	\vspace{20pt}
	\noindent
	{\zihao{-4} {\bfseries\bupt@label@ekeywords} {\bupt@meta@ekeywords}}
}

\newenvironment{notations}
{%
  \chapter*{\bupt@label@notations}
  \markboth{\bupt@label@notations}{}
  \pdfbookmark[0]{\bupt@label@notations}{notations}
  \begin{longtabu}{lX}
}
{\end{longtabu}}

\newenvironment{acknowledgement}
{%
  \chapter*{\bupt@label@acknowledgement}
  \addcontentsline{toc}{chapter}{\heiti\bupt@label@acknowledgement}
  \markboth{\bupt@label@acknowledgement}{}
}
{}

\pdfstringdefDisableCommands
{%
  \renewcommand{\heiti}{} % 在生成超链接时忽略字体设置命令
}

\RequirePackage{tikz}
\usetikzlibrary{positioning, calc}

\tikzset{
    subfiglabel/.style={
        anchor=north west,
        text opacity=1,
        inner sep=1pt,
        font=\small
    }
}

\newcommand{\subfigwithlabel}[1]{% 创建\subfigwithlabel命令以显示要求的子图标号
    \begin{tikzpicture}[
        inner sep=0pt,
        baseline=(imageNode.base) 
      ]
        \node (imageNode) {#1};
        \node[subfiglabel] at (imageNode.north west) {\thesubfigure};
    \end{tikzpicture}%
}

\RequirePackage{placeins}

\newcommand{\setappendixformat}{%
  \chapter*{\appendixname}
  \addcontentsline{toc}{chapter}{\heiti\appendixname}%

  \makeatletter
  \ctexset{%
    chapter = {
      break = \addpenalty{\@secpenalty}\FloatBarrier,
      format = \zihao{4}\heiti\bfseries\bheiti,
      beforeskip = 3.5ex plus 1ex minus .2ex,
      afterskip = 2.3ex plus .2ex,
    },
  }
  \makeatother

  \renewcommand{\thechapter}{\arabic{chapter}}

  \addtocontents{toc}{\protect\setcounter{tocdepth}{-1}}
  \hypersetup{bookmarksdepth=-1}
}

\newcommand{\unsetappendixformat}{%
    \hypersetup{bookmarksdepth=2}
    \addtocontents{toc}{\protect\setcounter{tocdepth}{2}}

    \makeatletter
    \ctexset{%
        chapter = {
            break = \if@openright\cleardoublepage\else\clearpage\fi,
            format = \zihao{3}\heiti\centering\bfseries\bheiti,
            beforeskip = 0pt,
            afterskip = 40pt,
        },
    }
    \makeatother
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\def\bupt@page@head{北京邮电大学本科毕业设计（论文）}
\def\bupt@label@covertitle{本\hspace{0.5em}科\hspace{0.5em}毕\hspace{0.5em}业\hspace{0.5em}设\hspace{0.5em}计（论文）}
\def\bupt@label@ecovertitle{Undergraduate Graduation Design (Thesis)}
\def\bupt@label@cmajor{专\hspace{2em}业}
\def\bupt@label@emajor{Subject}

\def\bupt@label@cauthor{姓\hspace{2em}名}
\def\bupt@label@eauthor{Candidate}
\def\bupt@label@csupervisor{指导教师}
\def\bupt@label@esupervisor{Supervisor}
\def\bupt@label@cdepartment{学\hspace{2em}院}
\def\bupt@label@edepartment{Institute}
\def\bupt@label@studentid{学\hspace{2em}号}
\def\bupt@label@estudentid{Student No.}
\def\bupt@label@classid{班\hspace{2em}级}
\def\bupt@label@eclassid{Class No.}
\def\bupt@label@classlevel{密级}

\def\bupt@label@ctitle{题目}
\def\bupt@label@etitle{Topic}
\def\bupt@label@classdur{保密期限}
\def\bupt@label@cschoolname{北京邮电大学}
\def\bupt@label@eschoolname{Beijing University of Posts and Telecommunications}
\def\bupt@title@sep{：}
\def\bupt@title@esep{:}

\def\bupt@declaration@title{北\hspace{0.5em}京\hspace{0.5em}邮\hspace{0.5em}电\hspace{0.5em}大\hspace{0.5em}学\par 本科毕业设计（论文）诚信声明}
\long\def\bupt@declaration@body{%
  本人声明所呈交的毕业设计（论文），题目《\bupt@meta@ctitle》是本人在指导教师的指导下，独立进行研究工作所取得的成果。尽我所知，除了文中特别加以标注和致谢中所罗列的内容以外，论文中不包含其他人已经发表或撰写过的研究成果，也不包含为获得北京邮电大学或其他教育机构的学位或证书而使用过的材料。\par%
  申请学位论文与资料若有不实之处，本人承担一切相关责任。%
}
\def\bupt@authorization@title{关于论文使用授权的说明}
\long\def\bupt@authorization@body{%
  本人完全了解并同意北京邮电大学有关保留、使用学位论文的规定，即：北京邮电大学拥有以下关于学位论文的无偿使用权，具体包括：学校有权保留并向国家有关部门或机构送交学位论文，有权允许学位论文被查阅和借阅；%
  学校可以公布学位论文的全部或部分内容，有权允许采用影印、缩印或其它复制手段保存。汇编学位论文，将学位论文的全部或部分内容编入有关数据库进行检索。%
  （保密的学位论文在解密后遵守此规定）%
}
\def\bupt@label@authorsigniture{本人签名：}
\def\bupt@label@supervisorsigniture{导师签名：}
\def\bupt@label@date{日期：}
\def\bupt@label@ckeywords{关键词\hspace{0.5em}}
\def\bupt@label@ekeywords{KEY WORDS\hspace{1em}}
\def\bupt@label@cabstract{摘\hspace{1em}要}
\def\bupt@label@eabstract{ABSTRACT}
\def\bupt@label@translation{外\hspace{1em}文\hspace{1em}译\hspace{1em}文}
\def\bupt@label@notations{符号说明}
\def\kwsep{\quad}
\def\bupt@label@refname{参考文献}
\def\bupt@label@listofacronyms{缩略语表}
\def\bupt@label@tableofpublications{攻读学位期间发表的学术论文目录}
\def\bupt@label@acknowledgement{致谢}

\def\bupt@meta@classlevel{公开}


\def\bupt@figurename{图}
\def\bupt@listfigurename{插图索引}
\def\bupt@tablename{表}
\def\bupt@listtablename{表格索引}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\endinput
