//go:build k8s

package k8s

import (
	"os"
	"strings"
	"testing"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
)

const proxyGroupManifests = "../../manifests/proxygroup"

func readManifest(t *testing.T, rel string) string {
	t.Helper()
	data, err := os.ReadFile(proxyGroupManifests + "/" + rel)
	if err != nil {
		t.Fatalf("read %s: %v", rel, err)
	}
	return string(data)
}

func TestProxyClassBaseHasNoForwardingOptimizations(t *testing.T) {
	base := readManifest(t, "base/proxyclasses.yaml")
	if strings.Contains(base, forwardingOptEnv) {
		t.Errorf("base proxyclasses.yaml must NOT set %s (that is the \"off\" state)", forwardingOptEnv)
	}
	for _, name := range []string{"common", "common-accept-routes"} {
		if !strings.Contains(base, "name: "+name) {
			t.Errorf("base proxyclasses.yaml missing ProxyClass %q", name)
		}
	}
}

func TestOverlayEnablesForwardingOptimizations(t *testing.T) {
	patch := readManifest(t, "overlays/on/patch-proxyclasses-env.yaml")
	if !strings.Contains(patch, forwardingOptEnv) {
		t.Errorf("overlay patch must set %s", forwardingOptEnv)
	}
	if !strings.Contains(patch, `value: "true"`) {
		t.Errorf("overlay patch must set %s to \"true\"", forwardingOptEnv)
	}
	for _, name := range []string{"common", "common-accept-routes"} {
		if !strings.Contains(patch, "name: "+name) {
			t.Errorf("overlay patch missing ProxyClass %q", name)
		}
	}
}

func TestProxyGroupBaseSpec(t *testing.T) {
	pg := readManifest(t, "base/proxygroup.yaml")
	for _, want := range []string{
		"name: " + ProxyGroupName,
		"type: egress",
		"replicas: 1",
		"proxyClass: common-accept-routes",
	} {
		if !strings.Contains(pg, want) {
			t.Errorf("base proxygroup.yaml missing %q", want)
		}
	}
}

func proxyGroupStatefulSet(revision string, optimizations bool, ready bool) *appsv1.StatefulSet {
	replicas := int32(1)
	sts := &appsv1.StatefulSet{
		Spec: appsv1.StatefulSetSpec{
			Replicas: &replicas,
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{Containers: []corev1.Container{{Name: "tailscale"}}},
			},
		},
		Status: appsv1.StatefulSetStatus{
			CurrentRevision: revision,
			UpdateRevision:  revision,
		},
	}
	if optimizations {
		sts.Spec.Template.Spec.Containers[0].Env = []corev1.EnvVar{{
			Name:  forwardingOptEnv,
			Value: "true",
		}}
	}
	if ready {
		sts.Status.ReadyReplicas = replicas
	}
	return sts
}

func TestProxyGroupRolloutReadyWaitsForNewRevisionOnToggle(t *testing.T) {
	before := ProxyGroupRolloutState{
		UpdateRevision:          "rev-off",
		ForwardingOptimizations: false,
	}

	stale := proxyGroupStatefulSet("rev-off", false, true)
	if proxyGroupRolloutReady(stale, before, true) {
		t.Fatal("stale ready revision must not satisfy an off-to-on rollout")
	}

	templateUpdatedWithoutRevision := proxyGroupStatefulSet("rev-off", true, true)
	if proxyGroupRolloutReady(templateUpdatedWithoutRevision, before, true) {
		t.Fatal("changed setting must produce a new update revision")
	}

	rolling := proxyGroupStatefulSet("rev-on", true, true)
	rolling.Status.CurrentRevision = "rev-off"
	if proxyGroupRolloutReady(rolling, before, true) {
		t.Fatal("old ready pods must not satisfy a pending new revision")
	}

	rolledOut := proxyGroupStatefulSet("rev-on", true, true)
	if !proxyGroupRolloutReady(rolledOut, before, true) {
		t.Fatal("fully rolled-out desired revision should be ready")
	}
}

func TestProxyGroupRolloutReadyWaitsForNewRevisionWhenDisabling(t *testing.T) {
	before := ProxyGroupRolloutState{
		UpdateRevision:          "rev-on",
		ForwardingOptimizations: true,
	}

	stale := proxyGroupStatefulSet("rev-on", true, true)
	if proxyGroupRolloutReady(stale, before, false) {
		t.Fatal("stale ready revision must not satisfy an on-to-off rollout")
	}

	rolledOut := proxyGroupStatefulSet("rev-off", false, true)
	if !proxyGroupRolloutReady(rolledOut, before, false) {
		t.Fatal("fully rolled-out disabled revision should be ready")
	}
}

func TestProxyGroupRolloutReadyAllowsIdempotentApply(t *testing.T) {
	before := ProxyGroupRolloutState{
		UpdateRevision:          "rev-off",
		ForwardingOptimizations: false,
	}
	sts := proxyGroupStatefulSet("rev-off", false, true)
	if !proxyGroupRolloutReady(sts, before, false) {
		t.Fatal("an already-ready matching revision should satisfy an idempotent apply")
	}
}
