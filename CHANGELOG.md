# Changelog

## [1.5.0](https://github.com/Abuubkar/foodio-mobile/compare/v1.4.0...v1.5.0) (2026-10-21)


### Features

* **identity:** the dev sign-in door, drawn only in a dev build ([#235](https://github.com/Abuubkar/foodio-mobile/issues/235)) ([520eb79](https://github.com/Abuubkar/foodio-mobile/commit/520eb793f9354a92ed8af052f5d91823888e8a46))
* **reviews:** photographs on a review, picked before and sent after ([#234](https://github.com/Abuubkar/foodio-mobile/issues/234)) ([b995295](https://github.com/Abuubkar/foodio-mobile/commit/b995295dd3babdcc90e39a4fbc31c1d376ef32ad))
* **saved:** saving needs a session, and sign-out empties the list ([#231](https://github.com/Abuubkar/foodio-mobile/issues/231)) ([b218761](https://github.com/Abuubkar/foodio-mobile/commit/b21876166ba450111eec62f02fca2c6dd4c2a340))

## [1.4.0](https://github.com/Abuubkar/foodio-mobile/compare/v1.3.0...v1.4.0) (2026-10-19)


### Features

* **address:** the map opens where you are, and fills what it can ([#223](https://github.com/Abuubkar/foodio-mobile/issues/223)) ([6d4df7f](https://github.com/Abuubkar/foodio-mobile/commit/6d4df7f44aaf19202b3cd3bb9a1d629857eb8807)), closes [#160](https://github.com/Abuubkar/foodio-mobile/issues/160)
* **android:** read the Firebase config, so a push token can exist ([#220](https://github.com/Abuubkar/foodio-mobile/issues/220)) ([f1d8adb](https://github.com/Abuubkar/foodio-mobile/commit/f1d8adb6ff1698e4f7ffcde85e067cb4dbd8c64b))
* **build:** shrink the release with R8, and walk the app to prove it ([#136](https://github.com/Abuubkar/foodio-mobile/issues/136)) ([5dbdafe](https://github.com/Abuubkar/foodio-mobile/commit/5dbdafeaa224974879dd7c807c381d13b207f242))
* **cart:** add more items from the cart ([#208](https://github.com/Abuubkar/foodio-mobile/issues/208)) ([82b0278](https://github.com/Abuubkar/foodio-mobile/commit/82b0278493d2483b11d7a286859d2118ab54cde0)), closes [#204](https://github.com/Abuubkar/foodio-mobile/issues/204)
* **cart:** the Cart survives closing the app ([#219](https://github.com/Abuubkar/foodio-mobile/issues/219)) ([0abc83c](https://github.com/Abuubkar/foodio-mobile/commit/0abc83c423141f391db114c0efad7e7b213f9a9b)), closes [#147](https://github.com/Abuubkar/foodio-mobile/issues/147)
* **cart:** the checkout button is pinned to the bottom and says the total ([#209](https://github.com/Abuubkar/foodio-mobile/issues/209)) ([258de36](https://github.com/Abuubkar/foodio-mobile/commit/258de3614e754298ec37d50ba4376943e1597edb)), closes [#205](https://github.com/Abuubkar/foodio-mobile/issues/205)
* **cart:** the header says whose food it is, when it arrives, and how much is in it ([#207](https://github.com/Abuubkar/foodio-mobile/issues/207)) ([42cc97e](https://github.com/Abuubkar/foodio-mobile/commit/42cc97e3969ef942b98142a486298e83dd2b4262))
* **checkout:** ask for the number the rider will call ([#139](https://github.com/Abuubkar/foodio-mobile/issues/139)) ([ea82538](https://github.com/Abuubkar/foodio-mobile/commit/ea8253800cdc6e9360e9c32d6936aaf5b224b968))
* **checkout:** card is announced, not offered ([#131](https://github.com/Abuubkar/foodio-mobile/issues/131)) ([b5ce4df](https://github.com/Abuubkar/foodio-mobile/commit/b5ce4df9527a54e8f40f4f0e53b26ee31c24768b))
* **checkout:** render the payment methods the restaurant serves ([#130](https://github.com/Abuubkar/foodio-mobile/issues/130)) ([4470ad7](https://github.com/Abuubkar/foodio-mobile/commit/4470ad7126a9924448b1ac3fba7afbd23061df4e))
* **checkout:** save the contact number as part of placing the order ([#175](https://github.com/Abuubkar/foodio-mobile/issues/175)) ([dc1e94b](https://github.com/Abuubkar/foodio-mobile/commit/dc1e94b508fd25e28eab0236a9e746a01c83881f))
* **claim:** list your restaurant, and finish it afterwards ([#124](https://github.com/Abuubkar/foodio-mobile/issues/124)) ([1811388](https://github.com/Abuubkar/foodio-mobile/commit/1811388d0fcc3548d9c0afad1c48481098d27bb9))
* **clips:** tap to pause, and show how far through it is ([#225](https://github.com/Abuubkar/foodio-mobile/issues/225)) ([f0d5931](https://github.com/Abuubkar/foodio-mobile/commit/f0d59318fe6a86cd3bc49fa5095ad2505153f203)), closes [#155](https://github.com/Abuubkar/foodio-mobile/issues/155)
* **clips:** the kitchen feed (Z) and the Saved screen (Y) ([#229](https://github.com/Abuubkar/foodio-mobile/issues/229)) ([6594f99](https://github.com/Abuubkar/foodio-mobile/commit/6594f9986cd2ee9cdc151654a5fc9b05a387f9a6))
* **discovery:** a rail of cuisines under the search bar ([#185](https://github.com/Abuubkar/foodio-mobile/issues/185)) ([bb1c2f0](https://github.com/Abuubkar/foodio-mobile/commit/bb1c2f0d821bcd416b23332de003c6d651f9e433)), closes [#183](https://github.com/Abuubkar/foodio-mobile/issues/183)
* **discovery:** home shows one view at a time ([#191](https://github.com/Abuubkar/foodio-mobile/issues/191)) ([b71b0cc](https://github.com/Abuubkar/foodio-mobile/commit/b71b0cc5e73a721e63c94582598549581fccfb44)), closes [#190](https://github.com/Abuubkar/foodio-mobile/issues/190)
* **discovery:** search gets a screen of its own, with pills and rows ([#184](https://github.com/Abuubkar/foodio-mobile/issues/184)) ([2ec3c1a](https://github.com/Abuubkar/foodio-mobile/commit/2ec3c1a22054c7a862ec0cb298781d58c06d9f3a))
* **discovery:** show every Restaurant on Home, not one row and empty space ([#173](https://github.com/Abuubkar/foodio-mobile/issues/173)) ([81e2001](https://github.com/Abuubkar/foodio-mobile/commit/81e2001d079cbcc7931de9d706f8d19e757967ea))
* **discovery:** the latest clips on home, not only in the clips tab ([#179](https://github.com/Abuubkar/foodio-mobile/issues/179)) ([67f66fe](https://github.com/Abuubkar/foodio-mobile/commit/67f66fe54073599b8412eba1038402c12dcc19f5)), closes [#178](https://github.com/Abuubkar/foodio-mobile/issues/178)
* **identity:** pick the country code instead of typing it ([b033f4a](https://github.com/Abuubkar/foodio-mobile/commit/b033f4afa514cc9ff9cc125db33afd86e62f4175))
* **identity:** pick the country code instead of typing it ([889cb4f](https://github.com/Abuubkar/foodio-mobile/commit/889cb4fb885120f7f73f0d64dab93e4deed673bf))
* **identity:** sign in with Google or Apple, no code to type ([#138](https://github.com/Abuubkar/foodio-mobile/issues/138)) ([111bd56](https://github.com/Abuubkar/foodio-mobile/commit/111bd569abd22de16c8091c12de880cae3b5c9de))
* **identity:** the chip opens an account, not just a role switcher ([#222](https://github.com/Abuubkar/foodio-mobile/issues/222)) ([d539c0f](https://github.com/Abuubkar/foodio-mobile/commit/d539c0f2e98cef8795ed8205059a98bc46a4f69b)), closes [#161](https://github.com/Abuubkar/foodio-mobile/issues/161)
* **join:** redeem a joining code ([#120](https://github.com/Abuubkar/foodio-mobile/issues/120)) ([30355d8](https://github.com/Abuubkar/foodio-mobile/commit/30355d8a63ad7dc83846c50758f4774b22b3fef7))
* **manage:** add another location, and move between plans ([#129](https://github.com/Abuubkar/foodio-mobile/issues/129)) ([deb1520](https://github.com/Abuubkar/foodio-mobile/commit/deb1520a953779fd939198ad669160c1afac7b1c))
* **manage:** edit the menu — dishes fully, sections lightly ([#121](https://github.com/Abuubkar/foodio-mobile/issues/121)) ([72f550a](https://github.com/Abuubkar/foodio-mobile/commit/72f550a36f4f74610bfe2e54bb07334d5b3be2b8))
* **manage:** explain why an unpaid restaurant cannot reopen ([#126](https://github.com/Abuubkar/foodio-mobile/issues/126)) ([bcb64a6](https://github.com/Abuubkar/foodio-mobile/commit/bcb64a6fc1f022ef662990caeefd876235102ba3))
* **manage:** going live, and why a restaurant is invisible ([#122](https://github.com/Abuubkar/foodio-mobile/issues/122)) ([3014cf7](https://github.com/Abuubkar/foodio-mobile/commit/3014cf7b172259a11e66b14981518a38973cc513))
* **manage:** the location and delivery-area editor ([#123](https://github.com/Abuubkar/foodio-mobile/issues/123)) ([3b47122](https://github.com/Abuubkar/foodio-mobile/commit/3b471225518a155ad43b474fb86948304ed319f6))
* **manage:** the Manage hub, and Profile as its first section ([#117](https://github.com/Abuubkar/foodio-mobile/issues/117)) ([f794262](https://github.com/Abuubkar/foodio-mobile/commit/f79426203e05e5ac6e5073c1e01ea5e785fe6543))
* **manage:** the opening-hours editor ([#118](https://github.com/Abuubkar/foodio-mobile/issues/118)) ([3b4fc77](https://github.com/Abuubkar/foodio-mobile/commit/3b4fc77d99e36cf093d80962b206cd2017095a30))
* **manage:** the Staff section, and joining by code ([#119](https://github.com/Abuubkar/foodio-mobile/issues/119)) ([5163aab](https://github.com/Abuubkar/foodio-mobile/commit/5163aab6c4fc29ee81da1d45274c35626d0768ad))
* **maps:** a real package id, and the Maps key out of git ([#132](https://github.com/Abuubkar/foodio-mobile/issues/132)) ([abf8717](https://github.com/Abuubkar/foodio-mobile/commit/abf871758144cc479472cc2fe02de8c73ab1245e))
* **menu:** add sits on the row's bottom right, not on the food ([#214](https://github.com/Abuubkar/foodio-mobile/issues/214)) ([a7ef10d](https://github.com/Abuubkar/foodio-mobile/commit/a7ef10dfdf6fd330199bdefdc560709613068503))
* **menu:** chips that jump to a part of a long Menu ([#174](https://github.com/Abuubkar/foodio-mobile/issues/174)) ([e5b75e9](https://github.com/Abuubkar/foodio-mobile/commit/e5b75e94d16c306868f66308d3f20f3cf3eb25c6))
* **menu:** choose what you are ordering, and see what it costs ([#224](https://github.com/Abuubkar/foodio-mobile/issues/224)) ([4898658](https://github.com/Abuubkar/foodio-mobile/commit/4898658e89737424940cd389cc6f73fcb63a327a)), closes [#148](https://github.com/Abuubkar/foodio-mobile/issues/148)
* **menu:** rows with a bigger photograph, add button on the photo ([#200](https://github.com/Abuubkar/foodio-mobile/issues/200)) ([1c77663](https://github.com/Abuubkar/foodio-mobile/commit/1c776634b23837abcd140ef3c48f3db20cccfac2)), closes [#196](https://github.com/Abuubkar/foodio-mobile/issues/196)
* **mocks:** identity routes, so the app runs with no database ([#215](https://github.com/Abuubkar/foodio-mobile/issues/215)) ([b6294f7](https://github.com/Abuubkar/foodio-mobile/commit/b6294f7a797a47d8763d65455d47e04fe00febad)), closes [#146](https://github.com/Abuubkar/foodio-mobile/issues/146)
* **mocks:** somewhere to register a push token ([#227](https://github.com/Abuubkar/foodio-mobile/issues/227)) ([767ada6](https://github.com/Abuubkar/foodio-mobile/commit/767ada6465f156425b777b5bb9c24e378993fa95))
* **mockups:** five directions for what lives on a Clip ([#228](https://github.com/Abuubkar/foodio-mobile/issues/228)) ([397f5f1](https://github.com/Abuubkar/foodio-mobile/commit/397f5f17367f42667cc2abf754afb5b6d0eb23b1))
* **notifications:** ask at the first Order, where there is a reason to give ([#221](https://github.com/Abuubkar/foodio-mobile/issues/221)) ([6ff1733](https://github.com/Abuubkar/foodio-mobile/commit/6ff1733a02aef819438129c408bbff988abb7003)), closes [#151](https://github.com/Abuubkar/foodio-mobile/issues/151)
* **orders:** one payment-method list, not two fixed words ([#127](https://github.com/Abuubkar/foodio-mobile/issues/127)) ([a1015c9](https://github.com/Abuubkar/foodio-mobile/commit/a1015c9824155b7e4daaeca1638f0471eee7b3cf))
* **orders:** show what is owed and what was collected ([#125](https://github.com/Abuubkar/foodio-mobile/issues/125)) ([6340287](https://github.com/Abuubkar/foodio-mobile/commit/634028773598abb5384bb539986c52e1466ad8b2))
* **photo:** a waiting photograph says so, instead of sitting grey ([#217](https://github.com/Abuubkar/foodio-mobile/issues/217)) ([890bd1c](https://github.com/Abuubkar/foodio-mobile/commit/890bd1c043a06669cd14d996a64c1189ce3cbe83)), closes [#152](https://github.com/Abuubkar/foodio-mobile/issues/152)
* **photos:** let a kitchen set the restaurant's own photograph ([#115](https://github.com/Abuubkar/foodio-mobile/issues/115)) ([76d0899](https://github.com/Abuubkar/foodio-mobile/commit/76d089925564d27a644983e8b0ee5f0f2912a979))
* **photos:** put a photograph on a dish from the kitchen ([#114](https://github.com/Abuubkar/foodio-mobile/issues/114)) ([f18e174](https://github.com/Abuubkar/foodio-mobile/commit/f18e174fbb3ced59c493a5b62ae5cb80f560de69))
* **restaurants:** a closed restaurant says when it opens, and says it before the cart ([#202](https://github.com/Abuubkar/foodio-mobile/issues/202)) ([b9e5ebf](https://github.com/Abuubkar/foodio-mobile/commit/b9e5ebf63f2fa2b707b12a37e8e0393d37d28e58)), closes [#156](https://github.com/Abuubkar/foodio-mobile/issues/156)
* **restaurants:** a Restaurant nobody has reviewed is New, not 0.0 ([#172](https://github.com/Abuubkar/foodio-mobile/issues/172)) ([7c21e27](https://github.com/Abuubkar/foodio-mobile/commit/7c21e2754dfcf7efac516a2b00049ed67ea82fae))
* **restaurants:** the page opens on the photo and the name ([#198](https://github.com/Abuubkar/foodio-mobile/issues/198)) ([82c68a3](https://github.com/Abuubkar/foodio-mobile/commit/82c68a3609bb9d5c4fecbcfac70b857c47b28a22)), closes [#193](https://github.com/Abuubkar/foodio-mobile/issues/193)
* **restaurants:** the page says whether it delivers to you ([#199](https://github.com/Abuubkar/foodio-mobile/issues/199)) ([5a6508e](https://github.com/Abuubkar/foodio-mobile/commit/5a6508ee7be5ef19e55b077eb12e2c7391c7f41f)), closes [#195](https://github.com/Abuubkar/foodio-mobile/issues/195)
* **reviews:** rate a delivered order, read them all ([fc8a7bf](https://github.com/Abuubkar/foodio-mobile/commit/fc8a7bfaa33ee791c9c77980f95e534326e959be))
* **reviews:** rate a delivered order, read them all ([26fcb34](https://github.com/Abuubkar/foodio-mobile/commit/26fcb34fa45bc06a6ccdf297abca9bd321d53958)), closes [#99](https://github.com/Abuubkar/foodio-mobile/issues/99)
* **ui:** pull to refresh on home, orders, and the staff queues ([cc0c26f](https://github.com/Abuubkar/foodio-mobile/commit/cc0c26f57edc05d306f4afe331bf2b09b13c456d))
* **ui:** show nothing where there is no photograph ([#113](https://github.com/Abuubkar/foodio-mobile/issues/113)) ([f6f6596](https://github.com/Abuubkar/foodio-mobile/commit/f6f6596b985a233d564a8a03eefd5af07df3b5cb))
* **work:** a Done tab for settled orders in both staff queues ([514cf26](https://github.com/Abuubkar/foodio-mobile/commit/514cf26a0cd21005e6e2fa5c7a6ac9b6d36780dd))
* **work:** a Done tab for settled orders in both staff queues ([926eef4](https://github.com/Abuubkar/foodio-mobile/commit/926eef45377b6e6ba99e7bbdd06d1c459bf8445b))
* **work:** kitchen and delivery act on orders ([bb2f7f0](https://github.com/Abuubkar/foodio-mobile/commit/bb2f7f01b3270eefb01a10f573d4b9f9cb0e87fd))
* **work:** kitchen and delivery act on orders ([f3bd7f4](https://github.com/Abuubkar/foodio-mobile/commit/f3bd7f464d64ff8525b19fd006961994a6a51518)), closes [#95](https://github.com/Abuubkar/foodio-mobile/issues/95)
* **work:** the kitchen marks dishes sold out ([ab2dc9d](https://github.com/Abuubkar/foodio-mobile/commit/ab2dc9db4b88c13f8852f767f9557ca4367ee09f))
* **work:** the kitchen marks dishes sold out ([e52caf9](https://github.com/Abuubkar/foodio-mobile/commit/e52caf901db6f5f7d6fe77d439f3f2aaf7cb6bd0)), closes [#97](https://github.com/Abuubkar/foodio-mobile/issues/97)


### Bug Fixes

* **build:** the release build works, and now has a number ([#133](https://github.com/Abuubkar/foodio-mobile/issues/133)) ([a44cf99](https://github.com/Abuubkar/foodio-mobile/commit/a44cf99516385ca6c946ef9fcfa9050bebe15179))
* **cart:** clear asks first, save takes one tap, an empty cart offers a way in, one stepper size ([#210](https://github.com/Abuubkar/foodio-mobile/issues/210)) ([38bb88a](https://github.com/Abuubkar/foodio-mobile/commit/38bb88af4d93c343b133457e67d92a3acae8bacf)), closes [#206](https://github.com/Abuubkar/foodio-mobile/issues/206)
* **checkout:** a blocker is the way to fix it, not just the news of it ([#218](https://github.com/Abuubkar/foodio-mobile/issues/218)) ([a1e3594](https://github.com/Abuubkar/foodio-mobile/commit/a1e3594333f2c981707efd9887a0b984bde20295)), closes [#159](https://github.com/Abuubkar/foodio-mobile/issues/159)
* **checkout:** a signed-out customer is asked to sign in, not walled off ([#180](https://github.com/Abuubkar/foodio-mobile/issues/180)) ([d22f8c5](https://github.com/Abuubkar/foodio-mobile/commit/d22f8c543e0c0540657b5e4232c3bfc619200953)), closes [#177](https://github.com/Abuubkar/foodio-mobile/issues/177)
* **clips:** the tab bar is black under the feed ([#189](https://github.com/Abuubkar/foodio-mobile/issues/189)) ([0afae9d](https://github.com/Abuubkar/foodio-mobile/commit/0afae9d6e33b321a2b6dd2fa13ebeeb1321f24f1))
* **clips:** videos no longer go black or flicker while scrolling ([8edeaf5](https://github.com/Abuubkar/foodio-mobile/commit/8edeaf50f4ae332c67f975a5bef0b520ee20a2e4))
* **clips:** videos no longer go black or flicker while scrolling ([184b3c4](https://github.com/Abuubkar/foodio-mobile/commit/184b3c451b7d5b484662e0c395732fa0b1b5e5b5))
* **discovery:** one rule under the home tabs, and air before the first card ([#192](https://github.com/Abuubkar/foodio-mobile/issues/192)) ([a054a3b](https://github.com/Abuubkar/foodio-mobile/commit/a054a3badbbfca1a8b645234ec8d1f7fa0ed9cb5))
* **discovery:** the all-restaurants heading drops its count ([#187](https://github.com/Abuubkar/foodio-mobile/issues/187)) ([0604782](https://github.com/Abuubkar/foodio-mobile/commit/0604782f95646edd6222dc50870a260a72bd33b0))
* **discovery:** the play icon sits still whatever the restaurant is called ([#181](https://github.com/Abuubkar/foodio-mobile/issues/181)) ([9a4d18f](https://github.com/Abuubkar/foodio-mobile/commit/9a4d18f5dbcbdc5e27f7a3184a49422c4abdf6e2))
* **discovery:** the play marker is a badge in the opposite corner ([#182](https://github.com/Abuubkar/foodio-mobile/issues/182)) ([c7c2cc7](https://github.com/Abuubkar/foodio-mobile/commit/c7c2cc7413631b33e7ad27f7d2fd924b35d3f2ff))
* **errors:** stop telling people they are offline when they are not ([#164](https://github.com/Abuubkar/foodio-mobile/issues/164)) ([0560a0a](https://github.com/Abuubkar/foodio-mobile/commit/0560a0a3b5f3377359af9f6a43625819eaab904f))
* **home:** the rails reach the screen edge, so a rating is not sliced ([#216](https://github.com/Abuubkar/foodio-mobile/issues/216)) ([d3aea60](https://github.com/Abuubkar/foodio-mobile/commit/d3aea60855e205845987743d7614e20f5f6534b1)), closes [#153](https://github.com/Abuubkar/foodio-mobile/issues/153)
* **i18n:** one word for the person who delivers ([#176](https://github.com/Abuubkar/foodio-mobile/issues/176)) ([df3e428](https://github.com/Abuubkar/foodio-mobile/commit/df3e428289dee6a629cca71aca773ed18ae773f7)), closes [#171](https://github.com/Abuubkar/foodio-mobile/issues/171)
* **identity:** a failed sign-in stays on the sign-in screen ([#162](https://github.com/Abuubkar/foodio-mobile/issues/162)) ([16bfa77](https://github.com/Abuubkar/foodio-mobile/commit/16bfa774aa8cda5e05e3086a692dabd6f30b5b1c))
* **ios:** prebuild survives a shell with no LANG set ([#141](https://github.com/Abuubkar/foodio-mobile/issues/141)) ([214caa6](https://github.com/Abuubkar/foodio-mobile/commit/214caa65311fff07c127d797522c1988be24d8de))
* **menu:** no heading under the chips that pin over it ([#197](https://github.com/Abuubkar/foodio-mobile/issues/197)) ([2f2adab](https://github.com/Abuubkar/foodio-mobile/commit/2f2adab606d63d518b416004b5ba4220511a65dc)), closes [#194](https://github.com/Abuubkar/foodio-mobile/issues/194)
* **mocks:** a clip's thumbnail is a frame of its own video ([#186](https://github.com/Abuubkar/foodio-mobile/issues/186)) ([1745b57](https://github.com/Abuubkar/foodio-mobile/commit/1745b578fb1f1f671456d84a62d6c96a79856f03))
* **mocks:** give the mock restaurants a status ([#137](https://github.com/Abuubkar/foodio-mobile/issues/137)) ([09d3774](https://github.com/Abuubkar/foodio-mobile/commit/09d37742476d03be51cf015dd88c5f469bd0f78a))
* **restaurants:** a page without a photograph starts under the back button ([#201](https://github.com/Abuubkar/foodio-mobile/issues/201)) ([cf7d768](https://github.com/Abuubkar/foodio-mobile/commit/cf7d76836457b1fc53b380d01c4ebe246196e062))
* **restaurants:** judge Open/Closed by the restaurant's clock ([3d0449a](https://github.com/Abuubkar/foodio-mobile/commit/3d0449a8830d04d88effd1b864cea54928a8315f))
* **restaurants:** judge Open/Closed by the restaurant's clock ([249b7e1](https://github.com/Abuubkar/foodio-mobile/commit/249b7e1f77eb478aa96c2f495c878e2e4fc062f9))
* **restaurants:** show every window of a split shift, not just the last ([#112](https://github.com/Abuubkar/foodio-mobile/issues/112)) ([40b74ec](https://github.com/Abuubkar/foodio-mobile/commit/40b74ec5e69a0be4b87316f7f60486a98198ff96))
* **restaurants:** the tile placeholder reads as a mark, not a broken letter ([#166](https://github.com/Abuubkar/foodio-mobile/issues/166)) ([d550824](https://github.com/Abuubkar/foodio-mobile/commit/d550824d80a770d890295df85248888c1c5a4e30))
* **session:** clear the query cache on sign-in and sign-out ([8a8a2f0](https://github.com/Abuubkar/foodio-mobile/commit/8a8a2f06c20be901450caca166a5b91459e431e6))
* **session:** clear the query cache on sign-in and sign-out ([4564f69](https://github.com/Abuubkar/foodio-mobile/commit/4564f69d8c6e293a0f123bf667e880c329299ee5))
* sheet safe-area insets, and pull to refresh ([66dc34f](https://github.com/Abuubkar/foodio-mobile/commit/66dc34f300894b649d7d9e756c93f553efed0965))
* **sheets:** a sheet's first tap counts while the keyboard is up ([#212](https://github.com/Abuubkar/foodio-mobile/issues/212)) ([9ac96a3](https://github.com/Abuubkar/foodio-mobile/commit/9ac96a370620928ff0e651434379b2f4ca62b09d))
* **theme:** add error and success to the Tailwind palette ([#116](https://github.com/Abuubkar/foodio-mobile/issues/116)) ([2019aa6](https://github.com/Abuubkar/foodio-mobile/commit/2019aa61d24b3b8364e244692416dba588404794))
* **theme:** give error the same scale as warning ([#128](https://github.com/Abuubkar/foodio-mobile/issues/128)) ([7325f05](https://github.com/Abuubkar/foodio-mobile/commit/7325f05be4f7e641ef1eb1042f39b552f4291cfc))
* **ui:** bottom sheets respect the home-indicator inset ([960b853](https://github.com/Abuubkar/foodio-mobile/commit/960b85303532fb4a63f1397788295c83fe64ec5a))
* **ui:** bound the Android tab bar ripple to a full circle ([f2f3623](https://github.com/Abuubkar/foodio-mobile/commit/f2f3623ea635ff1376f8379f1534acda7d1af53b))
* **ui:** bound the Android tab bar ripple to a full circle ([d375ae8](https://github.com/Abuubkar/foodio-mobile/commit/d375ae8625c481206c7e6ba604ed39aa36623cd7))
* **ui:** correct inset measurement and keyboard padding in sheets ([8be91c2](https://github.com/Abuubkar/foodio-mobile/commit/8be91c2b523911ffb90eabf25757abe5209920e2))
* **ui:** give the resting sheet visible clearance from the nav bar ([e4aa116](https://github.com/Abuubkar/foodio-mobile/commit/e4aa1164f8edf87118984c1a2344d605f5cb58b3))
* **ui:** keyboard avoidance for bottom sheets on Android ([70801ce](https://github.com/Abuubkar/foodio-mobile/commit/70801ce35df430301462364d57ce5a1c7a7dc3bc))
* **work:** cursor-paginate the staff order queue ([8aca8d1](https://github.com/Abuubkar/foodio-mobile/commit/8aca8d18b232803759c19fd3b6618fbbf1603e90))

## [1.3.0](https://github.com/hedonarc/foodio/compare/v1.2.0...v1.3.0) (2026-08-07)


### Features

* **restaurants:** the Deliverable Query — mark restaurants that can't reach you ([0ca1414](https://github.com/hedonarc/foodio/commit/0ca1414a4866319c1ac5b500239541fc203eace7))
* **restaurants:** the Deliverable Query — server-driven delivery range ([23614a9](https://github.com/hedonarc/foodio/commit/23614a9715d18358eef7653efaa0f58c19ef8af6))

## [1.2.0](https://github.com/hedonarc/foodio/compare/v1.1.0...v1.2.0) (2026-08-07)


### Features

* **notifications:** push token registration, foreground delivery, and deep-link on tap ([f03d8b9](https://github.com/hedonarc/foodio/commit/f03d8b936b72a0774f6e73b73e87995336df09ea))
* **notifications:** register the push token the app never sent ([8f0c563](https://github.com/hedonarc/foodio/commit/8f0c5630dc75e5c6f13f5f80dee426a1690f87ae))
* **orders,clips:** cursor-paginate past the 100/50-row cap ([268ab0c](https://github.com/hedonarc/foodio/commit/268ab0c2d4ce9d5748655868f6cfa06104a39643))
* **pagination:** cursor-paginate orders and clips instead of a hard page cap ([bc3afdd](https://github.com/hedonarc/foodio/commit/bc3afddd47fdb64707ee6ecb86124938c9031649))

## [1.1.0](https://github.com/hedonarc/foodio/compare/v1.0.0...v1.1.0) (2026-08-07)


### Features

* **checkout:** real, account-backed delivery addresses ([#73](https://github.com/hedonarc/foodio/issues/73)) ([20eb998](https://github.com/hedonarc/foodio/commit/20eb9987395b64952e9e4be9e0ea1fb145e4aedb))
* **identity:** real phone+OTP auth, and idempotent order placement ([#70](https://github.com/hedonarc/foodio/issues/70)) ([36c2bf8](https://github.com/hedonarc/foodio/commit/36c2bf8f58e5b0cc94f7007c3b689bcf1e5d4c74))
* **menu:** sold-out items are visible and cannot be ordered ([#74](https://github.com/hedonarc/foodio/issues/74)) ([2e13539](https://github.com/hedonarc/foodio/commit/2e13539c9edb8b77719d9ab9976956234a8e487e))


### Bug Fixes

* **identity:** a blank name silently blocked every returning sign-in ([#75](https://github.com/hedonarc/foodio/issues/75)) ([db005a7](https://github.com/hedonarc/foodio/commit/db005a777dd1d027c5cec42384662b43ce335420))

## 1.0.0 (2026-08-02)


### Features

* add project init ([b6dfd78](https://github.com/hedonarc/foodio/commit/b6dfd785ad75ac482fd469a5ceecffe16fe8d87b))
* add pull request template ([fabf2c3](https://github.com/hedonarc/foodio/commit/fabf2c3fae61cdbd2c7af59009dae41c729b73cf))
* add pull request template ([c5c71db](https://github.com/hedonarc/foodio/commit/c5c71db836c2ae0d14f6858d4c041bdb18ef951d))
* **api:** replace mock imports with a real HTTP data layer ([#9](https://github.com/hedonarc/foodio/issues/9)) ([8145d8d](https://github.com/hedonarc/foodio/commit/8145d8d67ec6519e7f239158ae9af929a230ebae))
* **cart:** a line is a dish plus an instruction, not a dish ([#49](https://github.com/hedonarc/foodio/issues/49)) ([87e1c08](https://github.com/hedonarc/foodio/commit/87e1c08792def22614f7ded51fd07f7d39e8cd92))
* **cart:** add the cart, the first half of the ordering spine ([#10](https://github.com/hedonarc/foodio/issues/10)) ([ae7b823](https://github.com/hedonarc/foodio/commit/ae7b8235831471cd615e87871603e10c45e8e002))
* **checkout:** an instruction survives to the placed order ([#52](https://github.com/hedonarc/foodio/issues/52)) ([f48079f](https://github.com/hedonarc/foodio/commit/f48079f54e4da2003b287a487a21803477f25a4b))
* **checkout:** close the ordering spine ([#16](https://github.com/hedonarc/foodio/issues/16)) ([caf15f7](https://github.com/hedonarc/foodio/commit/caf15f7b501653fc1d42d1ea9850dd8b91baf739))
* **discovery:** model Clips, replacing FeaturedVideo ([#30](https://github.com/hedonarc/foodio/issues/30)) ([abdc2d5](https://github.com/hedonarc/foodio/commit/abdc2d53965aff36bb6da3e864b420a8a48cb1df))
* **discovery:** the Clips tab — full-screen feed with the decided policy ([#39](https://github.com/hedonarc/foodio/issues/39)) ([23f3d5d](https://github.com/hedonarc/foodio/commit/23f3d5d5abd79020dc345973e9c10b512f0b206b))
* **discovery:** working search, and an orders screen ([#17](https://github.com/hedonarc/foodio/issues/17)) ([63bba43](https://github.com/hedonarc/foodio/commit/63bba4310f7824f0e26fe291c1eb038197fa2295))
* **identity:** people, sessions, and orders that belong to someone ([#64](https://github.com/hedonarc/foodio/issues/64)) ([a4b616d](https://github.com/hedonarc/foodio/commit/a4b616d7ebaba4fb944b14f9e7bb13d34a83c0be))
* **identity:** the chip reads as a control, not a portrait ([#67](https://github.com/hedonarc/foodio/issues/67)) ([d41df3d](https://github.com/hedonarc/foodio/commit/d41df3de1509e81c91350b497b74a16539ea53ef))
* **identity:** the identity chip — one control for who you are ([#65](https://github.com/hedonarc/foodio/issues/65)) ([2d9c4cc](https://github.com/hedonarc/foodio/commit/2d9c4cc1c706b48c1d4e415346b02c8ce1000061))
* implement persistent onboarding state management using SecureStore and hydration logic ([#6](https://github.com/hedonarc/foodio/issues/6)) ([3935412](https://github.com/hedonarc/foodio/commit/39354124f911be388f4d553ee78787484efdb815))
* implement restaurant home screen ([#7](https://github.com/hedonarc/foodio/issues/7)) ([9622fc9](https://github.com/hedonarc/foodio/commit/9622fc90eef5256ea6284b896869358d91d26847))
* implement restaurant menu feature ([#8](https://github.com/hedonarc/foodio/issues/8)) ([409dd37](https://github.com/hedonarc/foodio/commit/409dd374974f45c3f63841d0963f577cfa63f57f))
* **menu:** ours beside theirs, on the dish ([#51](https://github.com/hedonarc/foodio/issues/51)) ([d440202](https://github.com/hedonarc/foodio/commit/d440202080ed296c6d940b1a3edc7bf80321939c))
* **menu:** the dish page — quantity and a special instruction before adding ([#50](https://github.com/hedonarc/foodio/issues/50)) ([6a05616](https://github.com/hedonarc/foodio/commit/6a05616a5cfc7a18b78fe77867f5f7168ba685ba))
* **navigation:** tab bar — Home, Cart, Orders ([#38](https://github.com/hedonarc/foodio/issues/38)) ([1fa1320](https://github.com/hedonarc/foodio/commit/1fa132047bcc8208ab672a0d1a147ac7923550b2))
* **onboarding:** add permission screens  ([#2](https://github.com/hedonarc/foodio/issues/2)) ([2f06ecd](https://github.com/hedonarc/foodio/commit/2f06ecd33752ff3eb7bc3bb22011626932df6e14))
* **restaurants:** ours and theirs — clip shelves on the restaurant page ([#40](https://github.com/hedonarc/foodio/issues/40)) ([31cc04f](https://github.com/hedonarc/foodio/commit/31cc04fc307cdf12bcfb0187ab237a3f43a409ef))
* **work:** switching role changes the whole navigator ([#66](https://github.com/hedonarc/foodio/issues/66)) ([165d5cc](https://github.com/hedonarc/foodio/commit/165d5cc0db321e73ae392a66dd28f72dc6b629b6))


### Bug Fixes

* correct import paths in metro.config.js ([#5](https://github.com/hedonarc/foodio/issues/5)) ([7b2cf52](https://github.com/hedonarc/foodio/commit/7b2cf520936bf401fec6c7a456a8c9b3fadbc11e))
* **discovery:** scrim behind the clip overlay — white text vanished on pale footage ([#41](https://github.com/hedonarc/foodio/issues/41)) ([a7ef70c](https://github.com/hedonarc/foodio/commit/a7ef70cbeb58b1c3955bf310057d64f5d75bfecd))
* **ios:** give the location permission real usage copy ([#13](https://github.com/hedonarc/foodio/issues/13)) ([ddcd73c](https://github.com/hedonarc/foodio/commit/ddcd73c60a37847380b7f747e393fb7d75088b1d))
* **mocks:** failures wait as long as successes ([#62](https://github.com/hedonarc/foodio/issues/62)) ([835e4a2](https://github.com/hedonarc/foodio/commit/835e4a2911fca32e74c6159b1a461f16cbfdb5f0)), closes [#60](https://github.com/hedonarc/foodio/issues/60)
* **mocks:** replace two dead image URLs, and catch the next ones ([#29](https://github.com/hedonarc/foodio/issues/29)) ([175e0de](https://github.com/hedonarc/foodio/commit/175e0debf109127bd54f9d3dd0cb97206de34a6e))
* **navigation:** inset the clip viewer's controls, and stop double taps stacking screens ([#42](https://github.com/hedonarc/foodio/issues/42)) ([4d05feb](https://github.com/hedonarc/foodio/commit/4d05feb3510e099b5a1743271b113d2ad35a4e90))
* **onboarding:** Link text swallowed its own press; remove duplicate / route ([#14](https://github.com/hedonarc/foodio/issues/14)) ([c62d95b](https://github.com/hedonarc/foodio/commit/c62d95b2136f948a900f22e071ea0a19e92ae99e))
