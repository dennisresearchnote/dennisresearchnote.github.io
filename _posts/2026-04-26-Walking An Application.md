---
layout: post
title: Walking An Application
description: Manually review a web application for security issues using only your browsers developer tools. Hacking with just your browser, no tools or scripts.
author: dennis
date: 2026-04-26 12:01:00 +0900
categories: [Web Security, Application Security]
tags: [web-security, application-security, manual-testing, browser-based-testing, web-hacking, reconnaissance, devtools, network-analysis, xss, csrf, idor, bug-bounty, no-tools, browser-only]
pin: true
math: true
mermaid: true
image:
  path: /assets/thumbnails/2026-04-26-Walking An Application.png
  alt: image
---
> 브라우저의 개발자 도구만을 사용하여 웹 애플리케이션의 보안 취약점을 수동으로 분석합니다. <br> 별도의 도구나 스크립트 없이, 오직 브라우저만으로 수행하는 해킹 기법을 다룹니다.
{: .prompt-info }

# 웹 애플리케이션 탐색하기
이 내용은 브라우저에 기본적으로 포함된 개발자 도구만을 사용하여 웹 애플리케이션의 보안 취약점을 수동으로 분석하는 방법을 학습하는 과정이다. 자동화된 보안 도구나 스크립트는 많은 취약점과 중요한 정보를 놓칠 수 있기 때문에, 직접 웹 애플리케이션을 탐색하고 동작을 분석하는 능력이 중요하다는 점을 강조한다.

실습에서는 브라우저의 내장 도구들을 활용한다.
- View Source 기능은 웹사이트의 사람이 읽을 수 있는 HTML 소스 코드를 확인할 때 사용된다. 이를 통해 숨겨진 주석, 링크, 입력값 처리 방식 등의 정보를 확인할 수 있다.

- Inspector 도구는 페이지 요소를 직접 분석하고 수정하는 기능이다. HTML 구조와 CSS 속성을 확인할 수 있으며, 화면에서 숨겨진 요소를 강제로 표시하거나 차단된 콘텐츠를 확인하는 데 활용된다.

- Debugger는 JavaScript 코드의 실행 흐름을 분석하고 제어하는 기능이다. 브레이크포인트를 설정하여 코드가 어떻게 동작하는지 확인할 수 있으며, 클라이언트 측 검증 로직이나 숨겨진 기능을 분석할 때 유용하다.

- Network 도구는 웹페이지가 서버와 주고받는 모든 네트워크 요청을 확인하는 기능이다. HTTP 요청 및 응답, API 통신, 전달되는 데이터 등을 분석할 수 있으며, 인증 정보나 민감한 데이터가 노출되는지 확인하는 데 사용된다.

실습 환경은 가상 머신 기반으로 제공되며, “Start Machine” 버튼을 눌러 머신을 실행한 뒤 일정 시간이 지나면 제공되는 URL을 통해 대상 웹 애플리케이션에 접속하여 분석을 진행하게 된다.

# 웹사이트 탐색
침투 테스터로서 웹사이트나 웹 애플리케이션을 검토할 때의 역할은, 잠재적으로 취약할 수 있는 기능들을 찾아내고 실제로 이를 악용(Exploit)해 보면서 실제 취약 여부를 평가하는 것이다. 이러한 기능들은 일반적으로 사용자와의 상호작용이 필요한 웹사이트의 일부이다.

웹사이트의 상호작용 요소를 찾는 방법은 로그인 폼을 발견하는 것처럼 간단할 수도 있고, 웹사이트의 JavaScript를 수동으로 분석하는 방식일 수도 있다. 가장 좋은 시작 방법 중 하나는 브라우저만 사용하여 웹사이트를 직접 탐색하면서, 각 페이지·영역·기능을 정리하고 간단한 요약을 기록하는 것이다.

예를 들어, Acme IT Support 웹사이트를 검토했다면 사이트 리뷰는 다음과 같은 형태가 될 수 있다:

| Feature | URL | Summary |
|:---|:---|:---|
| Home Page | `/` | This page contains a summary of what Acme IT Support does with a company photo of their staff. |
| Latest News | `/news` | This page contains a list of recently published news articles by the company, and each news article has a link with an ID number, e.g. `/news/article?id=1`. |
| News Article | `/news/article?id=1` | Displays the individual news article. Some articles seem to be blocked and reserved for premium customers only. |
| Contact Page | `/contact` | This page contains a form for customers to contact the company. It contains name, email, and message input fields with a send button. |
| Customers | `/customers` | This link redirects to `/customers/login`. |
| Customer Login | `/customers/login` | This page contains a login form with username and password fields. |
| Customer Signup | `/customers/signup` | This page contains a user signup form that consists of username, email, password, and password confirmation input fields. |
| Customer Reset Password | `/customers/reset` | Password reset form with an email address input field. |
| Customer Dashboard | `/customers` | This page contains a list of the user's tickets submitted to the IT support company and a "Create Ticket" button. |
| Create Ticket | `/customers/ticket/new` | This page contains a form with a textbox for entering the IT issue and a file upload option to create an IT support ticket. |
| Customer Account | `/customers/account` | This page allows the user to edit their username, email, and password. |
| Customer Logout | `/customers/logout` | This link logs the user out of the customer area. |

# 페이지 소스 코드 확인
페이지 소스(Page Source)는 웹 서버에 요청을 보냈을 때 브라우저(클라이언트)로 반환되는 사람이 읽을 수 있는 코드입니다.

반환되는 코드는 다음과 같은 요소로 구성됩니다.

HTML (HyperText Markup Language)
CSS (Cascading Style Sheets)
JavaScript

이 코드들은 브라우저에:

어떤 콘텐츠를 표시할지,
어떻게 표시할지,
JavaScript를 통해 어떤 상호작용 기능을 제공할지

를 알려주는 역할을 합니다.

우리 목적에서 페이지 소스를 확인하면 웹 애플리케이션에 대한 추가 정보를 발견할 수 있습니다.

페이지 소스는 어떻게 보는가?

웹사이트를 보고 있는 상태에서:

페이지를 우클릭한 뒤
“View Page Source(페이지 소스 보기)”를 선택하면 됩니다.

또한 대부분의 브라우저는 URL 앞에 view-source: 를 붙이는 방법도 지원합니다.

예시:

view-source:https://www.google.com/

브라우저 메뉴에서도 페이지 소스 보기 기능을 찾을 수 있으며, 경우에 따라:

개발자 도구(Developer Tools)
More Tools

같은 하위 메뉴 안에 있을 수 있습니다.

페이지 소스를 살펴보기

Acme IT Support 웹사이트의 메인 페이지 소스를 확인해봅니다.

여기 보이는 모든 내용을 설명하는 것은 범위를 벗어나므로 웹 개발/디자인 학습이 추가로 필요합니다. 하지만 보안 관점에서 중요한 정보는 일부만 골라서 확인할 수 있습니다.

페이지 상단에는 다음과 같은 코드가 있습니다:

<!-- -->

이것은 주석(Comment)입니다.

주석은 개발자가:

다른 개발자에게 설명을 남기거나
자기 자신을 위한 메모/알림을 기록하기 위해 사용합니다.

주석은 실제 웹페이지에는 표시되지 않습니다.

이 예시의 주석에는:

현재 홈페이지가 임시 페이지이며
새로운 페이지를 개발 중이라는 내용

이 포함되어 있습니다.

주석에 있는 웹페이지를 열어 첫 번째 플래그를 획득할 수 있습니다.

HTML에서 다른 페이지 링크는 Anchor 태그(<a)로 작성됩니다.

이동할 주소는 href 속성에 저장됩니다.

예시:

<a href="/contact.html">

31번째 줄에서 contact 페이지 링크를 확인할 수 있습니다.

페이지 소스를 더 아래로 보면:

"secr" 로 시작하는 숨겨진 링크가 존재합니다.

이 링크를 열면 또 다른 플래그를 얻을 수 있습니다.

실제 환경에서는 플래그 대신:

사내 전용 페이지
직원 정보
고객 데이터 저장 영역

같은 민감한 정보가 발견될 수 있습니다.

CSS, JavaScript, 이미지 같은 외부 파일은 HTML 코드로 포함됩니다.

이 예시에서는:

모든 파일이 동일한 디렉터리에 저장되어 있습니다.

해당 디렉터리를 브라우저에서 직접 열어보면 설정 오류가 존재합니다.

원래는:

빈 페이지
또는
403 Forbidden

오류가 표시되어야 합니다.

하지만 현재는 디렉터리 목록 보기(Directory Listing)가 활성화되어 있어:

디렉터리 내부의 모든 파일 목록이 노출됩니다.

경우에 따라:

백업 파일
소스 코드
기밀 정보

가 포함될 수 있습니다.

이 예시에서는 flag.txt 파일에서 플래그를 얻을 수 있습니다.

많은 웹사이트는 처음부터 직접 개발되지 않고 프레임워크(Framework)를 사용합니다.

프레임워크는:

블로그 기능
사용자 관리
폼 처리

같은 일반 기능을 쉽게 추가할 수 있도록 미리 작성된 코드 모음입니다.

이를 사용하면 개발 시간을 크게 줄일 수 있습니다.

페이지 소스를 보면:

어떤 프레임워크를 사용하는지
버전이 무엇인지

확인할 수 있는 경우가 많습니다.

프레임워크와 버전 정보는 매우 중요합니다.

이유:

공개된 취약점(CVE)이 존재할 수 있고
최신 버전으로 업데이트되지 않았을 가능성이 있기 때문입니다.

페이지 하단의 주석에는:

사용 중인 프레임워크와 버전
공식 웹사이트 링크

가 포함되어 있습니다.

공식 사이트의 업데이트 공지를 확인하면:

현재 사이트가 오래된 버전을 사용 중임을 알 수 있으며
추가 플래그를 얻을 수 있는 정보를 발견할 수 있습니다.

# 개발자 도구 - 요소 검사(Inspector)
{: .mt-4 .mb-0 }

# 개발자 도구 - 디버거
{: .mt-4 .mb-0 }

# 개발자 도구 - 네트워크
{: .mt-4 .mb-0 }

### H3 — heading
{: .mt-4 .mb-0 }

#### H4 — heading
{: .mt-4 .mb-0 }
<!-- markdownlint-restore -->

## Paragraph

Quisque egestas convallis ipsum, ut sollicitudin risus tincidunt a. Maecenas interdum malesuada egestas. Duis consectetur porta risus, sit amet vulputate urna facilisis ac. Phasellus semper dui non purus ultrices sodales. Aliquam ante lorem, ornare a feugiat ac, finibus nec mauris. Vivamus ut tristique nisi. Sed vel leo vulputate, efficitur risus non, posuere mi. Nullam tincidunt bibendum rutrum. Proin commodo ornare sapien. Vivamus interdum diam sed sapien blandit, sit amet aliquam risus mattis. Nullam arcu turpis, mollis quis laoreet at, placerat id nibh. Suspendisse venenatis eros eros.

## Lists

### Ordered list

1. Firstly
2. Secondly
3. Thirdly

### Unordered list

- Chapter
  - Section
    - Paragraph

### ToDo list

- [ ] Job
  - [x] Step 1
  - [x] Step 2
  - [ ] Step 3

### Description list

Sun
: the star around which the earth orbits

Moon
: the natural satellite of the earth, visible by reflected light from the sun

## Block Quote

> This line shows the _block quote_.

## Prompts

<!-- markdownlint-capture -->
<!-- markdownlint-disable -->
> An example showing the `tip` type prompt.
{: .prompt-tip }

> An example showing the `info` type prompt.
{: .prompt-info }

> An example showing the `warning` type prompt.
{: .prompt-warning }

> An example showing the `danger` type prompt.
{: .prompt-danger }
<!-- markdownlint-restore -->

## Tables

| Company                      | Contact          | Country |
| :--------------------------- | :--------------- | ------: |
| Alfreds Futterkiste          | Maria Anders     | Germany |
| Island Trading               | Helen Bennett    |      UK |
| Magazzini Alimentari Riuniti | Giovanni Rovelli |   Italy |

## Links

<http://127.0.0.1:4000>

## Footnote

Clicking the hook will locate the footnote[^footnote], and here is another footnote[^fn-nth-2].

## Inline code

This is an example of `Inline Code`.

## Filepath

Here is the `/path/to/the/file.extend`{: .filepath}.

## Code blocks

### Common

<!-- markdownlint-disable-next-line MD040 -->
```
This is a common code snippet, without syntax highlight and line number.
```

### Specific Language

```bash
if [ $? -ne 0 ]; then
  echo "The command was not successful.";
  #do the needful / exit
fi;
```

### Specific filename

```sass
@import
  "colors/light-typography",
  "colors/dark-typography";
```
{: file='_sass/jekyll-theme-chirpy.scss'}

## Mathematics

The mathematics powered by [**MathJax**](https://www.mathjax.org/):

$$
\begin{equation}
  \sum_{n=1}^\infty 1/n^2 = \frac{\pi^2}{6}
  \label{eq:series}
\end{equation}
$$

We can reference the equation as \eqref{eq:series}.

When $a \ne 0$, there are two solutions to $ax^2 + bx + c = 0$ and they are

$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

## Mermaid SVG

```mermaid
 gantt
  title  Adding GANTT diagram functionality to mermaid
  apple :a, 2017-07-20, 1w
  banana :crit, b, 2017-07-23, 1d
  cherry :active, c, after b a, 1d
```

## Images

### Default (with caption)

![Desktop View](/posts/20190808/mockup.png){: width="972" height="589" }
_Full screen width and center alignment_

### Left aligned

![Desktop View](/posts/20190808/mockup.png){: width="972" height="589" .w-75 .normal}

### Float to left

![Desktop View](/posts/20190808/mockup.png){: width="972" height="589" .w-50 .left}
Praesent maximus aliquam sapien. Sed vel neque in dolor pulvinar auctor. Maecenas pharetra, sem sit amet interdum posuere, tellus lacus eleifend magna, ac lobortis felis ipsum id sapien. Proin ornare rutrum metus, ac convallis diam volutpat sit amet. Phasellus volutpat, elit sit amet tincidunt mollis, felis mi scelerisque mauris, ut facilisis leo magna accumsan sapien. In rutrum vehicula nisl eget tempor. Nullam maximus ullamcorper libero non maximus. Integer ultricies velit id convallis varius. Praesent eu nisl eu urna finibus ultrices id nec ex. Mauris ac mattis quam. Fusce aliquam est nec sapien bibendum, vitae malesuada ligula condimentum.

### Float to right

![Desktop View](/posts/20190808/mockup.png){: width="972" height="589" .w-50 .right}
Praesent maximus aliquam sapien. Sed vel neque in dolor pulvinar auctor. Maecenas pharetra, sem sit amet interdum posuere, tellus lacus eleifend magna, ac lobortis felis ipsum id sapien. Proin ornare rutrum metus, ac convallis diam volutpat sit amet. Phasellus volutpat, elit sit amet tincidunt mollis, felis mi scelerisque mauris, ut facilisis leo magna accumsan sapien. In rutrum vehicula nisl eget tempor. Nullam maximus ullamcorper libero non maximus. Integer ultricies velit id convallis varius. Praesent eu nisl eu urna finibus ultrices id nec ex. Mauris ac mattis quam. Fusce aliquam est nec sapien bibendum, vitae malesuada ligula condimentum.

### Dark/Light mode & Shadow

The image below will toggle dark/light mode based on theme preference, notice it has shadows.

![light mode only](/posts/20190808/devtools-light.png){: .light .w-75 .shadow .rounded-10 w='1212' h='668' }
![dark mode only](/posts/20190808/devtools-dark.png){: .dark .w-75 .shadow .rounded-10 w='1212' h='668' }

## Video

{% include embed/youtube.html id='Balreaj8Yqs' %}

## Reverse Footnote

[^footnote]: The footnote source
[^fn-nth-2]: The 2nd footnote source
