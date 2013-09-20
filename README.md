jasmine-flow
===============

Flow testing for Jasmine.

# Usage

```javascript
flow("visit /|type 'hello world'", function(fl) {
  fl.step("visit /", function() {
      window.location.href = "http://yoursite.com/";
    })
    .aver("#user_text is present", function() {
      expect($("#user_text").length).toEqual(1);
    })
    .step("type 'hello world' in #user_text and click button", function() {
      $("#user_text").val("hello world");
      $("button").click();
    })
    .aver("POST /user_text with 'hello world'", function() {
      // Using http://github.com/pivotal/jasmine-ajax
      expect(ajaxRequests.length).toEqual(1);
      expect(mostRecentAjaxRequest.method).toEqual("POST");
      expect(mostRecentAjaxRequest.url).toEqual("/user_text");
      expect(JSON.parse(mostRecentAjaxRequest.params)).toEqual({user_text: "hello world"});
    })
    .step("POST /user_text 200", function() {
        mostRecentAjaxRequest.response({
          status: 200,
          responseText: JSON.stringify({
            status: "OK"
          })
        });
    })
    .aver("shows a success flash message", function() {
      expect($("#flash_message").text()).toContain("You have successfully posted a message!");
    })
  ;
});
```

# Why?

So you are writing automated tests, ensuring that your edge cases are covered and the test suite is running fast, like under 5 seconds. Things are humming along smoothly. Your progress in adding features and business logic is accelerating and everybody is happy. But then there is this one feature with tons of edge cases that needs to be added. Before you know it, the test suite takes 30 seconds to run. It would be great to get the test suite back down to a more reasonable time, however the project needs to move forward and features need to get done.

Using the traditional setup and teardown structure and one [expectation per example](http://techblog.daveastels.com/2006/08/27/one-expectation-per-example-a-remake-of-one-assertion-per-test/), one can notice repetition of the setup for each test case.

```javascript
describe("Someone visits /login", function() {
  beforeEach(function() {
    // I'm assuming the usage a JSDOM here
    window.location.href = "http://yoursite.com/login";
    // setupPage is defined elsewhere to set up your page framework.
    setupPage();
  });

  it("shows a login form", function() {
    var $login = $("#login");
    expect($login.length).toEqual(1);
  });

  describe("fill out and submitting the login form", function() {
    beforeEach(function() {
      $("#login .name").val("user@example.com");
      $("#login .password").val("12345");
      $("#login button").click();
      $("#login").submit();
    });

    it("sends a POST /login with the name and password", function() {
      // Using http://github.com/pivotal/jasmine-ajax
      expect(ajaxRequests.length).toEqual(1);
      expect(mostRecentAjaxRequest.method).toEqual("POST");
      expect(mostRecentAjaxRequest.url).toEqual("/login");
      expect(JSON.parse(mostRecentAjaxRequest.params)).toEqual({name: "user@example.com", password: "12345"});
    });

    describe("POST /login 200", function() {
      beforeEach(function() {
        mostRecentAjaxRequest.response({
          status: 200,
          responseText: JSON.stringify({
            name: "User",
            email: "user@example.com"
          })
        });
      });

      it("redirects to the home page", function() {
        expect(window.location.href).toEqual("/");
      });
    });

    describe("POST /login 403", function() {
      beforeEach(function() {
        mostRecentAjaxRequest.response({
          status: 403,
          responseText: JSON.stringify({
            message: "Invalid email/password combination"
          })
        });
      });

      it("does not redirect to the home page", function() {
        expect(window.location.href).toEqual("http://yoursite.com/login");
      });

      it("shows an error", function() {
        expect($("#login .error").text()).toContain("Invalid email/password combination");
      });
    });
  });
});
```

Assuming the assertion time is negligible compared to the setup, the result is the test suite increases with n log n, where n is the context setup to the expectations. The deeper the context, the more logic needed to create the context, in a n log n fashion.

jasmine-flow is a library which reduces the context setup duplication by restructuring the tests into a linear flow. This, of course reduces the time needed to execute the test suite, without needing to parallelize the tests.

The above example would look like:

```javascript
flow("visit /login|invalid login|valid login", function(fl) {
  fl.step("visit /login", function() {
      // I'm assuming the usage a JSDOM here
      window.location.href = "http://yoursite.com/login";
      // setupPage is defined elsewhere to set up your page framework.
      setupPage();
    })
    .aver("shows a login form", function() {
      var $login = $("#login");
      expect($login.length).toEqual(1);
    })

    .step("fill out login form with invalid login credentials and submit", function() {
      $("#login .name").val("user@example.com");
      $("#login .password").val("wrong-password");
      $("#login button").click();
      $("#login").submit();
    })
    .aver("sends a POST /login with the name and password", function() {
      // Using http://github.com/pivotal/jasmine-ajax
      expect(ajaxRequests.length).toEqual(1);
      expect(mostRecentAjaxRequest.method).toEqual("POST");
      expect(mostRecentAjaxRequest.url).toEqual("/login");
      expect(JSON.parse(mostRecentAjaxRequest.params)).toEqual({name: "user@example.com", password: "wrong-password"});
    })
    .step("POST /login 403", function() {
      mostRecentAjaxRequest.response({
        status: 403,
        responseText: JSON.stringify({
          message: "Invalid email/password combination"
        })
      })
    })
    .aver("does not redirect to the home page", function() {
      expect(window.location.href).toEqual("http://yoursite.com/login");
    })
    .aver("shows an error", function() {
      expect($("#login .error").text()).toContain("Invalid email/password combination");
    })

    .step("fill out login form with valid login credentials and submit", function() {
      $("#login .name").val("user@example.com");
      $("#login .password").val("12345");
      $("#login button").click();
      $("#login").submit();
    })
    .aver("sends a POST /login with the name and password", function() {
      // Using http://github.com/pivotal/jasmine-ajax
      expect(ajaxRequests.length).toEqual(2);
      expect(mostRecentAjaxRequest.method).toEqual("POST");
      expect(mostRecentAjaxRequest.url).toEqual("/login");
      expect(JSON.parse(mostRecentAjaxRequest.params)).toEqual({name: "user@example.com", password: "12345"});
    })
    .step("POST /login 200", function() {
      mostRecentAjaxRequest.response({
        status: 200,
        responseText: JSON.stringify({
          name: "User",
          email: "user@example.com"
        })
      })
    .aver("redirects to the home page", function() {
      expect(window.location.href).toEqual("/");
    })
  ;
});
```

In this case, the /login page is loaded only once and the invalid as well as the valid login cases are tested. The number of test cases is reduced from 5 to 1 and the repeating execution of loading the /login page is avoided. Since less tests are run and less unnecessary context setup is executed, the test suite can have dramatic performance gains. On one of my projects, I have seen nearly a 10x gain of performance (~ 400 seconds to 40 seconds), without having to resort to parallelization.

# Blog Posts

[Fast and Thorough Testing with Jasmine Flow](http://briantakita.com/articles/fast-and-thorough-testing-with-jasmine-flow/)
